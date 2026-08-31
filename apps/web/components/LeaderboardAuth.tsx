"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { MemberOnlyModal } from "@/components/MemberOnlyModal";

export function LeaderboardAuth() {
  const { user } = useAuth();
  const [showMemberModal, setShowMemberModal] = useState(false);

  useEffect(() => {
    // Small delay to ensure auth state is loaded
    const timer = setTimeout(() => {
      if (!user) {
        setShowMemberModal(true);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user]);

  return (
    <MemberOnlyModal 
      isOpen={showMemberModal} 
      onClose={() => setShowMemberModal(false)} 
    />
  );
}
