import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jwtVerify } from 'npm:jose@5.2.0';

const rawSecret = Deno.env.get("JWT_SECRET");
if (!rawSecret) throw new Error("FATAL: JWT_SECRET missing");
const JWT_SECRET = new TextEncoder().encode(rawSecret);

Deno.serve(async (req) => {
  let base44 = null;
  let jobId = null;

  try {
    base44 = createClientFromRequest(req);

    const bodyText = await req.text();
    let body = {};
    try { body = JSON.parse(bodyText); } catch {}

    // JWT verification
    const ggToken = body.token;
    if (!ggToken) {
      return Response.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(ggToken, JWT_SECRET);
      payload = result.payload;
    } catch {
      return Response.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }
    const userEmail = payload.email;

    const {
      jobId: incomingJobId,
      prompt,
      add_context_from_internet = false,
      file_urls,
      response_json_schema,
      stage_statuses = ["Preparing context", "Calling AI", "Formatting response"]
    } = body;

    jobId = incomingJobId;

    if (!jobId || !prompt) {
      return Response.json({ success: false, error: 'Missing jobId or prompt' }, { status: 400 });
    }

    // Verify the job belongs to the authenticated user
    const jobs = await base44.asServiceRole.entities.AIJob.filter({ id: jobId });
    const job = jobs[0];

    if (!job) {
      return Response.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (job.user_email !== userEmail) {
      return Response.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const hasSourceAnalysis = add_context_from_internet || (Array.isArray(file_urls) ? file_urls.length > 0 : !!file_urls);

    const updateStage = async (stageIndex, status = 'running') => {
      const safeIndex = Math.max(0, Math.min(stageIndex, stage_statuses.length - 1));
      await base44.asServiceRole.entities.AIJob.update(jobId, {
        status,
        stage_index: safeIndex,
        stage_label: stage_statuses[safeIndex]
      });
    };

    await updateStage(0, 'running');

    if (hasSourceAnalysis && stage_statuses.length > 3) {
      await updateStage(1, 'running');
    }

    const aiStageIndex = hasSourceAnalysis && stage_statuses.length > 3 ? 2 : 1;
    await updateStage(aiStageIndex, 'running');

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet,
      file_urls,
      response_json_schema
    });

    const finalStageIndex = Math.max(0, stage_statuses.length - 1);
    await updateStage(finalStageIndex, 'running');

    await base44.asServiceRole.entities.AIJob.update(jobId, {
      status: 'completed',
      stage_index: stage_statuses.length,
      stage_label: 'Done',
      result_json: JSON.stringify(result)
    });

    return Response.json({ success: true, result });
  } catch (error) {
    if (base44 && jobId) {
      try {
        await base44.asServiceRole.entities.AIJob.update(jobId, {
          status: 'failed',
          error_message: error.message,
          stage_label: 'Failed'
        });
      } catch (_updateError) {
        console.error('Failed to update AI job error state');
      }
    }

    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});