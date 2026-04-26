import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MessageCircle, Users, Shield } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { useAuth } from "@/components/AuthGuard";
import FriendCodeCard from "@/components/friends/FriendCodeCard";
import FriendList from "@/components/friends/FriendList";
import SharedWorkPanel from "@/components/friends/SharedWorkPanel";
import FriendChatPanel from "@/components/friends/FriendChatPanel";

function generateFriendCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function buildCopiedNotes(existingNotes, friendName) {
  return [existingNotes, `Copied from ${friendName}`].filter(Boolean).join("\n\n");
}

function getFriendDraftKey(connectionId) {
  return `gg_friend_message_draft_${connectionId}`;
}

export default function FriendsPage() {
  const queryClient = useQueryClient();
  const { profile, userEmail, token, isLoading } = useAuth();
  const [friendCodeInput, setFriendCodeInput] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState(null);
  const [activeTab, setActiveTab] = useState("work");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetConnectionId = urlParams.get("connectionId");
    const targetTab = urlParams.get("tab");

    if (targetConnectionId) {
      setSelectedConnectionId(targetConnectionId);
    }

    if (targetTab === "messages" || targetTab === "work") {
      setActiveTab(targetTab);
    }
  }, []);
  const [messageText, setMessageText] = useState("");
  const [blockedWarning, setBlockedWarning] = useState("");
  const [friendCodeReady, setFriendCodeReady] = useState(false);

  useEffect(() => {
    if (!profile?.id || friendCodeReady) return;
    if (profile.friend_code) {
      setFriendCodeReady(true);
      return;
    }

    const newCode = generateFriendCode();
    secureEntity("StudentProfile").update(profile.id, { friend_code: newCode }).then(() => {
      setFriendCodeReady(true);
      queryClient.invalidateQueries({ queryKey: ["student-profile", userEmail] });
    });
  }, [profile?.id, profile?.friend_code, friendCodeReady, queryClient, userEmail]);

  const { data: allConnections = [] } = useQuery({
    queryKey: ["friend-connections"],
    queryFn: () => secureEntity("FriendConnection").list("-created_date", 200),
    enabled: !!userEmail
  });

  const friends = useMemo(() => {
    return allConnections
      .filter((connection) => (connection.member_emails || []).includes(userEmail))
      .map((connection) => {
        const emails = connection.member_emails || [];
        const names = connection.member_names || [];
        const friendIndex = emails.findIndex((email) => email !== userEmail);
        return {
          connectionId: connection.id,
          email: emails[friendIndex],
          name: names[friendIndex] || emails[friendIndex] || "Friend"
        };
      })
      .filter((friend) => !!friend.email);
  }, [allConnections, userEmail]);

  useEffect(() => {
    if (!friends.length) {
      setSelectedConnectionId(null);
      return;
    }
    if (!friends.some((friend) => friend.connectionId === selectedConnectionId)) {
      setSelectedConnectionId(friends[0].connectionId);
    }
  }, [friends, selectedConnectionId]);

  useEffect(() => {
    if (!selectedConnectionId) {
      setMessageText("");
      setBlockedWarning("");
      return;
    }

    setMessageText(localStorage.getItem(getFriendDraftKey(selectedConnectionId)) || "");
    setBlockedWarning("");
  }, [selectedConnectionId]);

  const selectedFriend = friends.find((friend) => friend.connectionId === selectedConnectionId) || null;

  const { data: sharedWork = { assignments: [], tests: [] } } = useQuery({
    queryKey: ["friend-shared-work", selectedFriend?.email],
    queryFn: async () => {
      const res = await base44.functions.invoke("getFriendSharedWork", {
        token,
        friend_email: selectedFriend.email
      });
      if (res.data?.error === "TOKEN_EXPIRED") {
        localStorage.removeItem("gg_user_email");
        localStorage.removeItem("gg_auth_token");
        window.location.href = "/?session_expired=1";
        return { assignments: [], tests: [] };
      }
      return {
        assignments: res.data.assignments || [],
        tests: res.data.tests || [],
      };
    },
    enabled: !!selectedFriend?.email && !!token
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["friend-messages", selectedConnectionId],
    queryFn: async () => {
      const res = await base44.functions.invoke("getMessages", { token, connection_id: selectedConnectionId });
      return res.data.messages;
    },
    enabled: !!selectedConnectionId && !!token
  });

  useEffect(() => {
    if (!selectedConnectionId) return;

    const unsubscribe = base44.entities.FriendMessage.subscribe((event) => {
      const changedConnectionId = event?.data?.connection_id || event?.old_data?.connection_id;
      if (changedConnectionId === selectedConnectionId) {
        queryClient.invalidateQueries({ queryKey: ["friend-messages", selectedConnectionId] });
      }
    });

    return unsubscribe;
  }, [selectedConnectionId, queryClient]);

  const addFriendMutation = useMutation({
    mutationFn: async () => {
      const code = friendCodeInput.trim().toUpperCase();
      const matches = await secureEntity("StudentProfile").filter({ friend_code: code });
      const target = matches[0];

      if (!target) throw new Error("Friend code not found.");
      if (target.user_email === userEmail) throw new Error("That is your own code.");
      if (friends.some((friend) => friend.email === target.user_email)) throw new Error("You're already friends.");

      const pair = [
        { email: userEmail, name: profile?.user_name || userEmail },
        { email: target.user_email, name: target.user_name || target.user_email }
      ].sort((a, b) => a.email.localeCompare(b.email));

      return secureEntity("FriendConnection").create({
        member_emails: pair.map((item) => item.email),
        member_names: pair.map((item) => item.name)
      });
    },
    onSuccess: () => {
      setFriendCodeInput("");
      queryClient.invalidateQueries({ queryKey: ["friend-connections"] });
      toast.success("Friend added!");
    },
    onError: (error) => toast.error(error.message)
  });

  const copyAssignmentMutation = useMutation({
    mutationFn: (assignment) => secureEntity("Assignment").create({
      user_email: userEmail,
      name: assignment.name,
      subject: assignment.subject,
      due_date: assignment.due_date,
      difficulty: assignment.difficulty,
      weight: assignment.weight,
      time_estimate: assignment.time_estimate,
      status: "pending",
      notes: buildCopiedNotes(assignment.notes, selectedFriend.name),
      is_recurring: assignment.is_recurring,
      recurrence_frequency: assignment.recurrence_frequency,
      attachment_url: assignment.attachment_url,
      attachment_name: assignment.attachment_name,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments", userEmail] });
      toast.success("Assignment copied to your profile.");
    },
    onError: (error) => toast.error(error?.message || "Couldn't copy this assignment. Please try again.")
  });

  const copyTestMutation = useMutation({
    mutationFn: (test) => secureEntity("Test").create({
      user_email: userEmail,
      name: test.name,
      subject: test.subject,
      test_date: test.test_date,
      topics: test.topics,
      difficulty: test.difficulty,
      status: "upcoming",
      notes: buildCopiedNotes(test.notes, selectedFriend.name),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests", userEmail] });
      toast.success("Test copied to your profile.");
    },
    onError: (error) => toast.error(error?.message || "Couldn't copy this test. Please try again.")
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ connectionId, content }) => {
      const response = await Promise.race([
        base44.functions.invoke("sendFriendMessage", {
          token: localStorage.getItem("gg_auth_token"),
          connectionId,
          senderName: profile?.user_name || userEmail,
          content
        }),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Message took too long to send. Your draft was saved — please try again.")), 12000);
        })
      ]);
      return response.data;
    },
    onSuccess: (data, variables) => {
      if (data.blocked) {
        const reason = data.reason || "Only educational messages are allowed.";
        setBlockedWarning(reason);
        toast.error(reason);
        return;
      }
      setBlockedWarning("");
      setMessageText("");
      localStorage.removeItem(getFriendDraftKey(variables.connectionId));
      queryClient.invalidateQueries({ queryKey: ["friend-messages", variables.connectionId] });
      toast.success("Message sent.");
    },
    onError: (error) => {
      const reason = error?.response?.data?.reason || error?.response?.data?.error || error.message;
      setBlockedWarning(reason);
      toast.error(reason);
    }
  });

  const { data: schools = [] } = useQuery({
    queryKey: ['school-brand', profile?.school_code],
    queryFn: () => secureEntity("School").filter({ school_code: profile.school_code }),
    enabled: !!profile?.school_code
  });
  const isAnonymized = schools[0]?.anonymize_students === true;

  if (isLoading || !profile) {
    return <div className="text-sm text-gray-400">Loading...</div>;
  }

  if (isAnonymized) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center py-24 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Shield className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Friends is unavailable</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Your school has student anonymization enabled for privacy compliance. The Friends feature is disabled for anonymized accounts.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }} className="space-y-6">
      <div className="rounded-2xl p-6 text-white shadow-xl" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.88) 0%, rgba(79,70,229,0.88) 100%)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Friends</h1>
            <p className="text-indigo-100 text-sm mt-1">Add friends, view the assignments and tests they choose to share, and send school-only messages.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[320px_minmax(0,1fr)] gap-6 items-start">
        <div className="space-y-4">
          <FriendCodeCard
            myCode={profile.friend_code}
            friendCodeInput={friendCodeInput}
            setFriendCodeInput={setFriendCodeInput}
            onAddFriend={() => addFriendMutation.mutate()}
            isAdding={addFriendMutation.isPending}
          />
          <FriendList
            friends={friends}
            selectedConnectionId={selectedConnectionId}
            onSelect={setSelectedConnectionId}
          />
        </div>

        <div className="rounded-2xl p-5 border border-white/70 bg-white/70 backdrop-blur min-h-[620px]">
          {!selectedFriend ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <Users className="w-10 h-10 mb-3" />
              <p className="font-medium text-gray-600">No friend selected yet</p>
              <p className="text-sm mt-1">Add a friend with their code to start sharing study plans.</p>
            </div>
          ) : (
            <div className="space-y-5 h-full flex flex-col">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedFriend.name}</h2>
                  <p className="text-sm text-gray-500">{selectedFriend.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("work")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "work" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    Shared work
                  </button>
                  <button
                    onClick={() => setActiveTab("messages")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "messages" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}
                  >
                    <MessageCircle className="w-4 h-4 inline mr-1.5" />
                    Messages
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                {activeTab === "work" ? (
                  <SharedWorkPanel
                    friendName={selectedFriend.name}
                    assignments={sharedWork.assignments}
                    tests={sharedWork.tests}
                    onCopyAssignment={(assignment) => copyAssignmentMutation.mutate(assignment)}
                    onCopyTest={(test) => copyTestMutation.mutate(test)}
                    copyingAssignmentId={copyAssignmentMutation.isPending ? copyAssignmentMutation.variables?.id : null}
                    copyingTestId={copyTestMutation.isPending ? copyTestMutation.variables?.id : null}
                  />
                ) : (
                  <FriendChatPanel
                    friendName={selectedFriend.name}
                    userEmail={userEmail}
                    messages={messages}
                    messageText={messageText}
                    setMessageText={(value) => {
                      setBlockedWarning("");
                      setMessageText(value);
                      if (selectedConnectionId) {
                        localStorage.setItem(getFriendDraftKey(selectedConnectionId), value);
                      }
                    }}
                    blockedWarning={blockedWarning}
                    onSend={() => {
                      const trimmedMessage = messageText.trim();
                      if (!trimmedMessage || !selectedConnectionId) return;
                      localStorage.setItem(getFriendDraftKey(selectedConnectionId), messageText);
                      sendMessageMutation.mutate({ connectionId: selectedConnectionId, content: trimmedMessage });
                    }}
                    isSending={sendMessageMutation.isPending}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}