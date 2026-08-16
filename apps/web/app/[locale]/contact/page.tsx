"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  MessageSquare,
  AlertTriangle,
  Briefcase,
  HelpCircle,
} from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
            Contact Us
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Need help? Found a bug? Want to partner with us? We're here to
            listen.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-card border border-border p-6 rounded-2xl text-center">
            <div className="w-12 h-12 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold mb-2">Support & Help</h3>
            <p className="text-sm text-muted-foreground">
              Having trouble with your account or a puzzle?
            </p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl text-center">
            <div className="w-12 h-12 mx-auto bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold mb-2">Report Abuse</h3>
            <p className="text-sm text-muted-foreground">
              Report inappropriate behavior or cheating.
            </p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl text-center">
            <div className="w-12 h-12 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="font-bold mb-2">Partnerships</h3>
            <p className="text-sm text-muted-foreground">
              Business inquiries and collaborations.
            </p>
          </div>
        </div>

        <div className="bg-card border border-border p-8 rounded-3xl max-w-2xl mx-auto">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Message Sent!</h2>
              <p className="text-muted-foreground">
                Thank you for reaching out. Our team will get back to you
                shortly.
              </p>
            </motion.div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Your Name</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Email Address</label>
                  <input
                    required
                    type="email"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">Topic</label>
                <select className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>General Inquiry</option>
                  <option>Technical Support</option>
                  <option>Account Issue</option>
                  <option>Report Abuse</option>
                  <option>Business Partnership</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">Message</label>
                <textarea
                  required
                  rows={5}
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-primary text-primary-foreground font-black text-lg rounded-xl uppercase tracking-widest hover:bg-primary/90 transition-colors"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
