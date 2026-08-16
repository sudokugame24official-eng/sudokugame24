"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Users,
  UserPlus,
  MessageSquare,
  ShieldBan,
  X,
  Trophy,
  MapPin,
  Calendar,
  Medal,
  Check,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data
type Message = {
  id: number;
  user: string;
  text: string;
  time: string;
  gender: string;
};

const MOCK_GLOBAL_MESSAGES: Message[] = [
  {
    id: 1,
    user: "Alex99",
    text: "Anyone wants to play a Diamond tier match?",
    time: "14:02",
    gender: "male",
  },
  {
    id: 2,
    user: "Elena_Pro",
    text: "I'm down! Create a room and invite me.",
    time: "14:03",
    gender: "female",
  },
  {
    id: 3,
    user: "SudokuGod",
    text: "Just beat my personal record! 02:14 on Hard.",
    time: "14:05",
    gender: "male",
  },
  {
    id: 4,
    user: "LogicQueen",
    text: "Wow, GG! I'm stuck on a Platinum grid right now.",
    time: "14:06",
    gender: "female",
  },
];

const ONLINE_USERS = [
  {
    id: 1,
    name: "Elena_Pro",
    gender: "female",
    age: 24,
    country: "Spain",
    rank: "Master",
    duelsWon: 342,
    badges: ["Speed Demon", "Top 100"],
  },
  {
    id: 2,
    name: "LogicQueen",
    gender: "female",
    age: 28,
    country: "Canada",
    rank: "Platinum",
    duelsWon: 156,
    badges: ["Flawless Victory"],
  },
  {
    id: 3,
    name: "Alex99",
    gender: "male",
    age: 21,
    country: "USA",
    rank: "Diamond",
    duelsWon: 289,
    badges: ["Veteran", "X-Wing Master"],
  },
  {
    id: 4,
    name: "SudokuGod",
    gender: "male",
    age: 31,
    country: "UK",
    rank: "Grandmaster",
    duelsWon: 1045,
    badges: ["World Champion", "Unbeatable"],
  },
  {
    id: 5,
    name: "Nina_Sky",
    gender: "female",
    age: 19,
    country: "France",
    rank: "Gold",
    duelsWon: 45,
    badges: ["Rising Star"],
  },
  {
    id: 6,
    name: "Kai_Zen",
    gender: "male",
    age: 26,
    country: "Japan",
    rank: "Diamond",
    duelsWon: 412,
    badges: ["Swordfish Expert"],
  },
];

type PrivateChat = {
  userId: number;
  userName: string;
  userGender: string;
};

export default function ChatRoomPage() {
  const [globalMessages, setGlobalMessages] =
    useState<Message[]>(MOCK_GLOBAL_MESSAGES);
  const [privateMessages, setPrivateMessages] = useState<{
    [userId: number]: Message[];
  }>({});

  const [activeTab, setActiveTab] = useState<"global" | number>("global");
  const [openTabs, setOpenTabs] = useState<PrivateChat[]>([]);

  const [inputValue, setInputValue] = useState("");
  const [selectedUser, setSelectedUser] = useState<
    (typeof ONLINE_USERS)[0] | null
  >(null);

  // Interactive Button States
  const [friendStatus, setFriendStatus] = useState<"idle" | "sent">("idle");
  const [blockStatus, setBlockStatus] = useState<"idle" | "blocked">("idle");

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic: only scrolls the internal container, never the window.
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [globalMessages, privateMessages, activeTab]);

  // Reset button states when selecting a new user
  useEffect(() => {
    if (selectedUser) {
      setFriendStatus("idle");
      setBlockStatus("idle");
    }
  }, [selectedUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now(),
      user: "You",
      text: inputValue,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      gender: "male",
    };

    if (activeTab === "global") {
      setGlobalMessages([...globalMessages, newMessage]);
    } else {
      const currentPrivateMsgs = privateMessages[activeTab] || [];
      setPrivateMessages({
        ...privateMessages,
        [activeTab]: [...currentPrivateMsgs, newMessage],
      });
    }
    setInputValue("");
  };

  const handleAddFriend = () => {
    setFriendStatus("sent");
    setTimeout(() => setFriendStatus("idle"), 3000);
  };

  const handleBlockUser = () => {
    setBlockStatus("blocked");
    setTimeout(() => {
      // If we had a tab open with them, close it
      if (selectedUser) {
        handleCloseTab(selectedUser.id);
      }
      setSelectedUser(null);
      setBlockStatus("idle");
    }, 1500);
  };

  const handleOpenPrivateChat = (user: (typeof ONLINE_USERS)[0]) => {
    // Check if tab exists
    if (!openTabs.find((t) => t.userId === user.id)) {
      setOpenTabs([
        ...openTabs,
        { userId: user.id, userName: user.name, userGender: user.gender },
      ]);
      // Initialize empty messages if none exist
      if (!privateMessages[user.id]) {
        setPrivateMessages({ ...privateMessages, [user.id]: [] });
      }
    }
    setActiveTab(user.id);
    setSelectedUser(null); // Close modal
  };

  const handleCloseTab = (userId: number) => {
    const newTabs = openTabs.filter((t) => t.userId !== userId);
    setOpenTabs(newTabs);
    if (activeTab === userId) {
      setActiveTab("global");
    }
  };

  // Determine what messages to show based on active tab
  const currentMessages =
    activeTab === "global" ? globalMessages : privateMessages[activeTab] || [];

  // Determine placeholder based on active tab
  const activeChatName =
    activeTab === "global"
      ? "Global Lounge"
      : openTabs.find((t) => t.userId === activeTab)?.userName || "User";

  return (
    <div className="h-[calc(100vh-72px)] bg-gradient-to-br from-[#020F24] via-[#041E42] to-[#0A2A5C] text-white flex overflow-hidden relative">
      {/* Decorative background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#FF4500]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#00BFFF]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hide Scrollbar CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative border-r border-white/5 z-10">
        {/* Tabs Bar */}
        <div className="flex bg-[#041E42]/80 backdrop-blur-xl border-b border-white/10 overflow-x-auto no-scrollbar shrink-0 shadow-lg relative z-20">
          <button
            onClick={() => setActiveTab("global")}
            className={`flex items-center gap-2 px-8 py-5 font-black uppercase tracking-widest text-sm whitespace-nowrap transition-all relative ${
              activeTab === "global"
                ? "text-[#FFCC00] bg-white/5"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Globe className="w-5 h-5" /> Global Lounge
            {activeTab === "global" && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-[#FFCC00] shadow-[0_0_15px_#FFCC00]"
              />
            )}
          </button>

          {openTabs.map((tab) => (
            <div
              key={tab.userId}
              className={`flex items-center gap-2 px-4 py-5 font-bold text-sm whitespace-nowrap transition-all relative group ${
                activeTab === tab.userId
                  ? "bg-white/5"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <button
                onClick={() => setActiveTab(tab.userId)}
                className={`flex items-center gap-2 ${activeTab === tab.userId ? (tab.userGender === "female" ? "text-pink-400" : "text-blue-400") : "text-gray-400 group-hover:text-white transition-colors"}`}
              >
                <MessageSquare className="w-4 h-4" /> {tab.userName}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab.userId);
                }}
                className="ml-3 text-gray-500 hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-500/20"
              >
                <X className="w-4 h-4" />
              </button>
              {activeTab === tab.userId && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#FF4500] shadow-[0_0_15px_#FF4500]"
                />
              )}
            </div>
          ))}
        </div>

        {/* Message Feed */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar bg-black/20"
        >
          {currentMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner">
                <MessageSquare className="w-10 h-10 opacity-50" />
              </div>
              <p className="text-xl font-bold text-gray-400">
                No messages yet.
              </p>
              <p className="text-sm mt-2">Say hello to {activeChatName}!</p>
            </div>
          ) : (
            currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.user === "You" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 shadow-xl border border-white/10 ${
                    msg.user === "You"
                      ? "bg-gradient-to-br from-[#FF4500] to-[#CC3700] text-white"
                      : msg.gender === "female"
                        ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white"
                        : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
                  }`}
                >
                  {msg.user.charAt(0).toUpperCase()}
                </div>
                <div
                  className={
                    msg.user === "You" ? "flex flex-col items-end" : ""
                  }
                >
                  <div
                    className={`flex items-baseline gap-3 mb-1.5 ${msg.user === "You" ? "flex-row-reverse" : ""}`}
                  >
                    <span
                      className={`font-black text-sm tracking-wide ${msg.user === "You" ? "text-[#FF4500]" : msg.gender === "female" ? "text-pink-400" : "text-blue-400"}`}
                    >
                      {msg.user}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {msg.time}
                    </span>
                  </div>
                  <div
                    className={`px-5 py-3.5 max-w-2xl text-sm md:text-base shadow-lg backdrop-blur-md border ${
                      msg.user === "You"
                        ? "bg-gradient-to-br from-[#FF4500] to-[#E63E00] rounded-2xl rounded-tr-sm text-white border-[#FF6B33]"
                        : "bg-white/10 rounded-2xl rounded-tl-sm text-gray-100 border-white/5"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 md:p-6 bg-[#041E42]/90 backdrop-blur-xl border-t border-white/10 shrink-0 z-20">
          <form
            onSubmit={handleSendMessage}
            className="max-w-5xl mx-auto relative flex items-center group"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Message ${activeChatName}...`}
              className="w-full bg-black/40 border-2 border-white/10 rounded-2xl py-4 pl-6 pr-20 text-white font-medium focus:outline-none focus:border-[#FF4500] focus:bg-black/60 transition-all shadow-inner placeholder:text-gray-500"
            />
            <button
              type="submit"
              className={`absolute right-2 top-2 bottom-2 aspect-square rounded-xl flex items-center justify-center transition-all ${
                inputValue.trim()
                  ? "bg-gradient-to-br from-[#FFCC00] to-[#FFA500] text-[#041E42] shadow-[0_0_15px_rgba(255,204,0,0.5)] hover:scale-105"
                  : "bg-white/10 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Send
                className={`w-5 h-5 ${inputValue.trim() ? "-ml-0.5" : ""}`}
              />
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar - Online Users */}
      <div className="w-80 border-l border-white/5 bg-[#041E42]/80 backdrop-blur-md flex flex-col shrink-0 hidden lg:flex z-10 shadow-2xl relative">
        <div className="h-[65px] border-b border-white/10 flex items-center px-6 justify-between shrink-0 bg-white/5">
          <h2 className="font-black text-white uppercase tracking-widest text-sm flex items-center gap-3">
            <Users className="w-5 h-5 text-[#FFCC00]" />
            Players
          </h2>
          <span className="bg-[#FFCC00]/20 text-[#FFCC00] border border-[#FFCC00]/50 text-xs font-black px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(255,204,0,0.2)]">
            124
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {ONLINE_USERS.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/10 border border-transparent hover:border-white/10 cursor-pointer transition-all group"
            >
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-lg group-hover:scale-105 transition-transform ${
                    user.gender === "female"
                      ? "bg-gradient-to-br from-pink-500 to-rose-600 text-white"
                      : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-[#041E42] rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p
                  className={`font-bold text-sm truncate group-hover:text-white transition-colors ${user.gender === "female" ? "text-pink-300" : "text-blue-300"}`}
                >
                  {user.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Trophy className="w-3 h-3 text-[#FFCC00]" />
                  <p className="text-xs text-gray-400 truncate font-medium">
                    {user.rank}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#0A2A5C] border-2 border-[#FFCC00]/50 w-full max-w-md rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden relative"
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 text-white/50 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-all z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header Banner */}
              <div
                className={`h-32 ${selectedUser.gender === "female" ? "bg-gradient-to-r from-pink-600 to-purple-600" : "bg-gradient-to-r from-blue-600 to-cyan-600"}`}
              />

              <div className="px-8 pb-8 relative">
                {/* Avatar */}
                <div
                  className={`w-24 h-24 rounded-full border-4 border-[#0A2A5C] flex items-center justify-center font-black text-4xl shadow-xl -mt-12 mb-4 ${
                    selectedUser.gender === "female"
                      ? "bg-pink-500 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>

                <h2
                  className={`text-2xl font-black mb-1 ${selectedUser.gender === "female" ? "text-pink-400" : "text-blue-400"}`}
                >
                  {selectedUser.name}
                </h2>

                <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-6">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />{" "}
                    {selectedUser.country}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-gray-400" />{" "}
                    {selectedUser.age} y/o
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                    <Trophy className="w-8 h-8 text-[#FFCC00] mb-2" />
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Rank
                    </p>
                    <p className="text-lg font-black text-white">
                      {selectedUser.rank}
                    </p>
                  </div>
                  <div className="bg-black/30 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                    <Medal className="w-8 h-8 text-[#FF4500] mb-2" />
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Duels Won
                    </p>
                    <p className="text-lg font-black text-white">
                      {selectedUser.duelsWon}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div className="mb-8">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-3 font-bold">
                    Badges
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.badges.map((badge) => (
                      <span
                        key={badge}
                        className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-xs font-bold text-[#FFCC00]"
                      >
                        ★ {badge}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={handleAddFriend}
                    className={`col-span-2 font-black py-3 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
                      friendStatus === "sent"
                        ? "bg-green-500 text-white"
                        : "bg-[#FFCC00] hover:bg-white text-[#041E42]"
                    }`}
                  >
                    {friendStatus === "sent" ? (
                      <>
                        <Check className="w-5 h-5" /> Request Sent
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" /> Add Friend
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenPrivateChat(selectedUser)}
                    className="col-span-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center shadow-lg"
                    title="Private Message"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleBlockUser}
                    className={`col-span-3 mt-2 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors py-2 ${
                      blockStatus === "blocked"
                        ? "text-red-500"
                        : "text-gray-500 hover:text-red-400"
                    }`}
                  >
                    {blockStatus === "blocked" ? (
                      <>
                        <ShieldBan className="w-4 h-4" /> User Blocked
                      </>
                    ) : (
                      <>
                        <ShieldBan className="w-4 h-4" /> Block User
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
