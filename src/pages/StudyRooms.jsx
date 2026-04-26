import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { secureEntity } from "@/lib/secureEntities";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, LogIn, Shield } from "lucide-react";
import { motion } from "framer-motion";
import RoomView from "@/components/studyroom/RoomView";
import InviteLinkButton from "@/components/studyroom/InviteLinkButton";
import { useAuth } from "@/components/AuthGuard";
import { secureEntity as secureEntityFn } from "@/lib/secureEntities";

const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function StudyRooms() {
  const { profile, userEmail } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [inviteHandled, setInviteHandled] = useState(false);
  const queryClient = useQueryClient();

  const token = localStorage.getItem("gg_auth_token");

  const { data: schoolsForAnon = [] } = useQuery({
    queryKey: ["study-room-school-anon", profile?.school_code],
    queryFn: () => secureEntityFn("School").filter({ school_code: profile.school_code }),
    enabled: !!profile?.school_code,
  });
  const isAnonymized = schoolsForAnon[0]?.anonymize_students === true;

  const { data: rooms = [] } = useQuery({
    queryKey: ["study-rooms", profile?.school_code],
    queryFn: async () => {
      const res = await base44.functions.invoke("studyRoomLookup", {
        token,
        action: "list_school_rooms",
        school_code: profile.school_code,
      });
      return res.data.rooms || [];
    },
    enabled: !!profile?.school_code && !!token,
    refetchInterval: 8000,
  });

  const myRooms = rooms.filter((r) => r.member_emails?.includes(userEmail));

  useEffect(() => {
    if (!profile || !userEmail || inviteHandled || selectedRoomId) return;

    const inviteCode = new URLSearchParams(window.location.search).get("invite")?.toUpperCase();
    if (!inviteCode) return;

    setInviteHandled(true);

    const joinFromInvite = async () => {
      let room = rooms.find((item) => item.room_code === inviteCode);
      if (!room) {
        const res = await base44.functions.invoke("studyRoomLookup", {
          token,
          action: "find_by_invite",
          room_code: inviteCode,
        });
        room = res.data.room;
      }

      if (!room) {
        setJoinError("This invite link is no longer valid.");
        return;
      }

      if (!room.member_emails?.includes(userEmail)) {
        await base44.functions.invoke("studyRoomLookup", {
          token,
          action: "join",
          room_id: room.id,
          data: { user_name: profile.user_name || userEmail },
        });
        queryClient.invalidateQueries(["study-rooms"]);
      }

      const url = new URL(window.location.href);
      url.searchParams.delete("invite");
      window.history.replaceState({}, "", url.toString());
      setSelectedRoomId(room.id);
    };

    joinFromInvite();
  }, [profile, userEmail, inviteHandled, selectedRoomId, rooms, queryClient]);

  const handleCreate = async () => {
    if (!newRoomName.trim() || !profile) return;
    setCreating(true);
    const room = await secureEntity("StudyRoom").create({
      name: newRoomName.trim(),
      creator_email: userEmail,
      school_code: profile.school_code,
      room_code: genCode(),
      member_emails: [userEmail],
      member_names: [profile.user_name || userEmail],
      status: "lobby",
    });
    queryClient.invalidateQueries(["study-rooms"]);
    setNewRoomName("");
    setCreating(false);
    setSelectedRoomId(room.id);
  };

  const handleJoin = async () => {
    if (!profile) return;
    const code = joinCode.trim().toUpperCase();
    setJoinError("");
    setJoining(true);
    const res = await base44.functions.invoke("studyRoomLookup", {
      token,
      action: "find_by_code",
      room_code: code,
      school_code: profile.school_code,
    });
    const room = res.data.room;
    if (!room) {
      setJoinError("Room not found. Check the code and try again.");
      setJoining(false);
      return;
    }
    if (!room.member_emails?.includes(userEmail)) {
      await base44.functions.invoke("studyRoomLookup", {
        token,
        action: "join",
        room_id: room.id,
        data: { user_name: profile.user_name || userEmail },
      });
      queryClient.invalidateQueries(["study-rooms"]);
    }
    setJoinCode("");
    setJoinError("");
    setJoining(false);
    setSelectedRoomId(room.id);
  };

  if (!profile) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl" />
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-40 bg-gray-100 rounded-2xl" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
        <div className="h-48 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (isAnonymized) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center py-24 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
          <Shield className="w-8 h-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-800">Quiz Competition is unavailable</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          Your school has student anonymization enabled for privacy compliance. Live quiz competitions are disabled for anonymized accounts.
        </p>
      </motion.div>
    );
  }

  if (selectedRoomId) {
    return (
      <RoomView
        roomId={selectedRoomId}
        userEmail={userEmail}
        userName={profile?.user_name || userEmail}
        onBack={() => setSelectedRoomId(null)}
        onLeave={async () => {
          const room = rooms.find((item) => item.id === selectedRoomId);
          if (room && room.member_emails?.includes(userEmail)) {
            const memberIndex = room.member_emails.indexOf(userEmail);
            await secureEntity("StudyRoom").update(room.id, {
              member_emails: room.member_emails.filter((email) => email !== userEmail),
              member_names: (room.member_names || []).filter((_, index) => index !== memberIndex),
            });
          }
          setSelectedRoomId(null);
          queryClient.invalidateQueries(["study-rooms"]);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Competition</h1>
          <p className="text-sm text-gray-500">
            Compete in live quizzes with classmates and compare scores
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-white/80 backdrop-blur border border-white/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-500" /> Create Competition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Competition name (e.g. Bio Quiz Battle)"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={handleCreate}
              disabled={creating || !newRoomName.trim() || !profile}
            >
              {creating ? "Creating..." : "Create Competition"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border border-white/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <LogIn className="w-4 h-4 text-purple-500" /> Join Competition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Enter 6-letter competition code"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase());
                if (joinError) setJoinError("");
              }}
              maxLength={6}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="font-mono tracking-widest"
            />
            {joinError && <p className="text-xs text-red-500">{joinError}</p>}
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={handleJoin}
              disabled={joinCode.trim().length < 6 || !profile || joining}
            >
              {joining ? "Joining..." : "Join Competition"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {myRooms.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Your Competitions
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {myRooms.map((room) => (
              <motion.div
                key={room.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Card
                  className="bg-white/80 backdrop-blur border border-white/60 shadow-sm cursor-pointer hover:shadow-md transition-all"
                  onClick={() => setSelectedRoomId(room.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{room.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {room.member_emails?.length || 1} member
                        {(room.member_emails?.length || 1) !== 1 ? "s" : ""} ·
                        Code:{" "}
                        <span className="font-mono font-bold text-indigo-600">
                          {room.room_code}
                        </span>
                      </p>
                      <InviteLinkButton roomCode={room.room_code} className="mt-3 h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50" />
                    </div>
                    <Badge
                      className={
                        room.status === "lobby"
                          ? "bg-green-100 text-green-700"
                          : room.status === "active"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {room.status === "lobby"
                        ? "Waiting"
                        : room.status === "active"
                        ? "Quiz Active"
                        : "Finished"}
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 rounded-2xl border border-dashed border-white/70" style={{ background: "rgba(255,255,255,0.45)", backdropFilter: "blur(16px)" }}>
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No competitions yet</p>
          <p className="text-sm mb-2">
            Start one to quiz your classmates live, or join one with a competition code.
          </p>
          <p className="text-xs text-gray-400">A good first step is creating a quick battle for your next test topic.</p>
        </div>
      )}
    </div>
  );
}