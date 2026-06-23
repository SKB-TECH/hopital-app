import {
  CalendarDays,
  Heart,
  ShieldCheck,
  Ticket,
} from "lucide-react";

export const websiteImages = {
  hero: "/images/heroo.png",
  stage: "/images/heroo.png",
  city: "/images/heroo.png",
  venue: "/images/heroo.png",
  map: "/images/heroo.png",
  portrait: "/images/logo.jpeg",
};

export const faqs = [
  {
    title: "Buying Tickets",
    icon: Ticket,
    tone: "blue",
    questions: [
      "How do I receive my tickets after purchase?",
      "Can I pay using multiple methods?",
      "Do I need to print my tickets?",
    ],
  },
  {
    title: "Selling Events",
    icon: CalendarDays,
    tone: "amber",
    questions: [
      "How much does it cost to list an event?",
      "When do I receive my event payouts?",
    ],
  },
  {
    title: "Account & Security",
    icon: ShieldCheck,
    tone: "blue",
    questions: ["How do I enable Two-Factor Authentication (2FA)?"],
  },
  {
    title: "Refunds & Cancellations",
    icon: Heart,
    tone: "red",
    questions: ["What is the refund policy for cancelled events?"],
  },
];
