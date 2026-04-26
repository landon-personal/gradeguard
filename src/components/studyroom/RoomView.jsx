import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Play, Trophy, Clock, Sparkles, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InviteLinkButton from "@/components/studyroom/InviteLinkButton";
import LiveLeaderboard from "@/components/studyroom/LiveLeaderboard";
import SharedNotesPanel from "@/components/studyroom/SharedNotesPanel";
import PodiumDisplay from "@/components/studyroom/PodiumDisplay";
import { sortLeaderboard } from "@/components/studyroom/leaderboardUtils";

export default function RoomView({ roomId, userEmail, userName, onBack, onLeave }) {
  const [room, setRoom] = useState(null);
  const [results, setResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [quizActive, setQuizActive] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [customTopic, setCustomTopic] = useState("");

  // Initial room load
  useEffect(() => {
    secureEntity("StudyRoom").filter({ id: roomId }).then((arr) => {
      if (arr[0]) {
        setRoom(arr[0]);
        if (arr[0].status === "active" && arr[0].quiz_questions_json) {
          activateQuiz(arr[0].quiz_questions_json);
        }
      }
    });
    secureEntity("StudyRoomResult").filter({ room_id: roomId }).then(setResults);
  }, [roomId]);

  // Real-time room subscription
  useEffect(() => {
    const unsub = base44.entities.StudyRoom.subscribe((event) => {
      if (event.id !== roomId) return;
      setRoom(event.data);
      if (event.data.status === "active" && event.data.quiz_questions_json && !quizActive) {
        activateQuiz(event.data.quiz_questions_json);
      }
    });
    return unsub;
  }, [roomId, quizActive]);

  // Real-time results subscription
  useEffect(() => {
    const unsub = base44.entities.StudyRoomResult.subscribe((event) => {
      if (event.data?.room_id !== roomId) return;
      setResults((prev) => {
        const exists = prev.find((r) => r.id === event.id);
        if (exists) return prev.map((r) => (r.id === event.id ? event.data : r));
        return [...prev, event.data];
      });
    });
    return unsub;
  }, [roomId]);

  const activateQuiz = (json) => {
    try {
      const qs = JSON.parse(json);
      if (qs?.length) {
        setQuestions(qs);
        setQuizActive(true);
      }
    } catch (e) {}
  };

  // Fetch host's upcoming tests
  const { data: tests = [] } = useQuery({
    queryKey: ["tests-for-room", userEmail],
    queryFn: () =>
      secureEntity("Test").filter({ user_email: userEmail, status: "upcoming" }),
    enabled: room?.creator_email === userEmail,
  });

  const isHost = room?.creator_email === userEmail;
  const myResult = results.find((r) => r.user_email === userEmail);

  const handleStartQuiz = async () => {
    setGenerating(true);
    const test = tests.find((t) => t.id === selectedTestId);
    const topic = test
      ? `${test.name} (${test.subject})${test.topics ? " covering: " + test.topics : ""}`
      : customTopic;

    const result = await base44.integrations.Core.InvokeLLM({
      model: "gpt_5",
      prompt: `Create 8 multiple choice quiz questions for a student studying: ${topic}. Make them challenging but appropriate for a school student.`,
      response_json_schema: {
        type: "object",
        properties: {
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                question: { type: "string" },
                options: { type: "array", items: { type: "string" } },
                correct: {
                  type: "number",
                  description: "Index of correct answer (0-3)",
                },
                explanation: { type: "string" },
              },
            },
          },
        },
      },
    });

    if (!result?.questions?.length) {
      setGenerating(false);
      return;
    }

    await secureEntity("StudyRoom").update(roomId, {
      status: "active",
      quiz_questions_json: JSON.stringify(result.questions),
      quiz_test_name: test?.name || customTopic,
      quiz_subject: test?.subject || customTopic,
    });
    setGenerating(false);
  };

  const handleSubmit = async () => {
    const correct = questions.filter((q, i) => answers[i] === q.correct).length;
    const score = Math.round((correct / questions.length) * 100);
    setSubmitted(true);
    await secureEntity("StudyRoomResult").create({
      room_id: roomId,
      user_email: userEmail,
      user_name: userName,
      score_pct: score,
      correct_count: correct,
      total_questions: questions.length,
    });
    const newResults = await secureEntity("StudyRoomResult").filter({ room_id: roomId });
    if (newResults.length >= (room?.member_emails?.length || 1)) {
      await secureEntity("StudyRoom").update(roomId, { status: "finished" });
    }
  };

  if (!room) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // ── QUIZ SCREEN ──────────────────────────────────────────────────
  if (quizActive && !submitted && questions.length > 0) {
    const q = questions[currentQ];
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">{room.name}</p>
            <p className="text-xs text-indigo-500 font-medium">Quiz battle is live</p>
          </div>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {results.length}/{room.member_emails?.length || 1} done
          </span>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
          <div className="space-y-4">
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i < currentQ
                      ? "bg-indigo-400"
                      : i === currentQ
                      ? "bg-indigo-600"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="bg-white/90 shadow-md">
                  <CardContent className="p-6 space-y-4">
                    <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide">
                      Question {currentQ + 1} of {questions.length}
                    </p>
                    <p className="text-lg font-semibold text-gray-900">{q.question}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            setAnswers((prev) => ({ ...prev, [currentQ]: i }))
                          }
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                            answers[currentQ] === i
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-gray-200 bg-white hover:border-indigo-300 text-gray-700"
                          }`}
                        >
                          <span className="font-bold mr-2">
                            {String.fromCharCode(65 + i)}.
                          </span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
                disabled={currentQ === 0}
              >
                Back
              </Button>
              {currentQ < questions.length - 1 ? (
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={() => setCurrentQ((q) => q + 1)}
                  disabled={answers[currentQ] === undefined}
                >
                  Next
                </Button>
              ) : (
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleSubmit}
                  disabled={Object.keys(answers).length < questions.length}
                >
                  Submit Quiz
                </Button>
              )}
            </div>
          </div>

          <LiveLeaderboard
            results={results}
            memberEmails={room.member_emails || []}
            memberNames={room.member_names || []}
            userEmail={userEmail}
          />
        </div>
      </div>
    );
  }

  // ── LEADERBOARD SCREEN ──────────────────────────────────────────
  if (submitted || room.status === "finished") {
    const sorted = sortLeaderboard(results);
    const medals = ["🥇", "🥈", "🥉"];

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Competition Leaderboard</h2>
            <p className="text-sm text-gray-400">{room.name}</p>
          </div>
        </div>

        {myResult && (
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">Your Score</p>
                <p className="text-5xl font-bold">{myResult.score_pct}%</p>
                <p className="text-sm opacity-70 mt-1">
                  {myResult.correct_count}/{myResult.total_questions} correct
                </p>
              </div>
              <Trophy className="w-14 h-14 opacity-40" />
            </CardContent>
          </Card>
        )}

        {room.status === "finished" && (
          <PodiumDisplay results={sorted} userEmail={userEmail} />
        )}

        <SharedNotesPanel
          roomId={roomId}
          schoolCode={room.school_code}
          userEmail={userEmail}
          userName={userName}
        />

        <div className="space-y-2">
          {sorted.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card
                className={`shadow-sm ${
                  r.user_email === userEmail
                    ? "border-indigo-300 bg-indigo-50/60"
                    : "bg-white/80"
                }`}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <span className="w-8 text-lg text-center">
                    {i < 3 ? medals[i] : <span className="text-sm font-bold text-gray-400">{i + 1}</span>}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">
                      {r.user_name}
                      {r.user_email === userEmail && (
                        <span className="text-xs text-indigo-500 ml-1">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {r.correct_count}/{r.total_questions} correct
                    </p>
                  </div>
                  <span className="text-xl font-bold text-gray-800">
                    {r.score_pct}%
                  </span>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {room.status !== "finished" && (
          <p className="text-center text-xs text-gray-400 animate-pulse py-2">
            Waiting for others to finish...
          </p>
        )}

        <div className="pt-2 flex flex-col items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            Back to Competitions
          </Button>
          <button onClick={onLeave} className="text-xs text-red-400 hover:text-red-600 transition-colors">
            Leave this competition
          </button>
        </div>
      </div>
    );
  }

  // ── LOBBY SCREEN ────────────────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{room.name}</h2>
            <p className="text-sm text-gray-500">
              Share code:{" "}
              <span className="font-mono font-bold text-indigo-600">
                {room.room_code}
              </span>
            </p>
          </div>
        </div>
        <InviteLinkButton roomCode={room.room_code} className="border-indigo-200 text-indigo-700 hover:bg-indigo-50" />
      </div>

      <Card className="bg-white/80 shadow-sm">
        <CardContent className="p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4" /> Members ({room.member_emails?.length || 0})
          </p>
          <div className="flex flex-wrap gap-2">
            {(room.member_emails || []).map((email, i) => (
              <div
                key={email}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium"
              >
                {email === room.creator_email && (
                  <Crown className="w-3 h-3 text-yellow-500" />
                )}
                {room.member_names?.[i] || email.split("@")[0]}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isHost ? (
        <Card className="bg-white/80 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" /> Pick a quiz topic
            </p>
            {tests.length > 0 && (
              <Select value={selectedTestId} onValueChange={(v) => { setSelectedTestId(v); setCustomTopic(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an upcoming test..." />
                </SelectTrigger>
                <SelectContent>
                  {tests.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} ({t.subject})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              placeholder={tests.length > 0 ? "Or type a custom topic..." : "Topic (e.g. 'Causes of WWI')"}
              value={customTopic}
              onChange={(e) => { setCustomTopic(e.target.value); setSelectedTestId(""); }}
            />
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={handleStartQuiz}
              disabled={generating || (!selectedTestId && !customTopic.trim())}
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⟳</span> Generating Quiz...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Play className="w-4 h-4" /> Start Quiz for Everyone
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-indigo-50 border-indigo-200 shadow-sm">
          <CardContent className="p-6 text-center text-indigo-600">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-60" />
            <p className="font-semibold">Waiting for the host to start...</p>
            <p className="text-xs text-indigo-400 mt-1">
              You'll be taken to the quiz automatically
            </p>
          </CardContent>
        </Card>
      )}

      <SharedNotesPanel
        roomId={roomId}
        schoolCode={room.school_code}
        userEmail={userEmail}
        userName={userName}
      />

      {!isHost && (
        <div className="flex justify-center pt-2">
          <button onClick={onLeave} className="text-xs text-red-400 hover:text-red-600 transition-colors">
            Leave this competition
          </button>
        </div>
      )}
    </div>
  );
}