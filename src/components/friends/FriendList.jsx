import { Users } from "lucide-react";

export default function FriendList({ friends, selectedConnectionId, onSelect }) {
  return (
    <div className="rounded-2xl p-5 border border-white/70 bg-white/70 backdrop-blur">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-indigo-500" />
        <h2 className="font-semibold text-gray-900">Friends</h2>
      </div>

      <div className="space-y-2">
        {friends.length === 0 ? (
          <p className="text-sm text-gray-400">No friends yet — add someone with their code.</p>
        ) : (
          friends.map((friend) => (
            <button
              key={friend.connectionId}
              onClick={() => onSelect(friend.connectionId)}
              className={`w-full text-left rounded-xl px-3 py-3 transition-all border ${
                selectedConnectionId === friend.connectionId
                  ? "bg-indigo-50 border-indigo-200"
                  : "bg-white border-gray-100 hover:border-indigo-100"
              }`}
            >
              <p className="font-medium text-gray-800">{friend.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{friend.email}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}