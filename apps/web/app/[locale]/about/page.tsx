"use client";
import React from "react";
import { motion } from "framer-motion";
import { Target, Users, ShieldCheck, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400 uppercase tracking-tight">
          About Sudoku Premium
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Our mission is to build the ultimate global Sudoku ecosystem where
          users can play, learn, compete, improve, socialize, and build a
          long-term logic habit.
        </p>
        <p className="text-md text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We believe Sudoku is more than just a newspaper puzzle. It is a
          fundamental exercise in pure logic, pattern recognition, and mental
          endurance. Our platform is built to elevate Sudoku into a competitive,
          educational, and global experience. Whether you are learning your
          first Naked Single or competing for the top of the Master League, this
          is your home.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-card p-6 rounded-3xl border border-border"
        >
          <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Competitive Integrity</h3>
          <p className="text-muted-foreground">
            Our true-random, single-solution generators ensure that every match
            and daily challenge is perfectly fair. No guessing required.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-card p-6 rounded-3xl border border-border"
        >
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Global Community</h3>
          <p className="text-muted-foreground">
            Join a worldwide network of logic enthusiasts. Discuss strategies,
            make friends, and challenge rivals in real-time.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-card p-6 rounded-3xl border border-border"
        >
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Education First</h3>
          <p className="text-muted-foreground">
            From basic rules to advanced techniques like Swordfish and Forcing
            Chains, our Sudoku Academy is free and accessible to everyone.
          </p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-card p-6 rounded-3xl border border-border"
        >
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4">
            <Heart className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Accessibility & Privacy</h3>
          <p className="text-muted-foreground">
            Built with modern standards, keyboard navigation, and strict privacy
            controls. We respect your data and your focus.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
