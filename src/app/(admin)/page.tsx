
"use client";

// import AgentCard from "@/components/agentCard/AgentCard";
import withProtection from "@/hoc/ProtectRoute";
import Card from "@/layout/Card";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// const agents = [
//     {
//       imageUrl:
//         "https://cdn.builder.io/api/v1/image/assets/b014a6c787294818ace0aa39ccaddb4a/707ece4afff22450679b6f8e699d261dcf103293?placeholderIfAbsent=true",
//       badgeText: "Agent X",
//       title: "Your Trusted Sales Companion",
//       description:
//         "Hi I am Agent X and I book more appointments for your sales team through personalized outreach via Phone, Email and Text Messages all on autopilot 24/7.",
//       slug: "/agentic-ai",
//     },
//     {
//       imageUrl:
//         "https://cdn.builder.io/api/v1/image/assets/b014a6c787294818ace0aa39ccaddb4a/740714b291d9cb569afecf7381ef40a7c0a20845?placeholderIfAbsent=true",
//       badgeText: "Voice X",
//       title: "AI that speaks your Customer’s Language",
//       description:
//         "I ensure your customers feel truly heard, speaking to them in your voice and language. I build a connection that resonates with your audience every time.",
//       slug: "/genaivoice",
//     },
//     {
//       imageUrl: "./images/Profile3.png",
//       badgeText: "Converse X",
//       title: "Smartest AI Conversational Partner",
//       description:
//         "I engage users, answer questions, and resolve their issues anytime, any channel via WhatsApp , Instagram , Facebook, website, Mobile Apps.",
//       slug: "/genaichat",
//     },
//   ];



const Home = () => {
  const router = useRouter();
  useEffect(() => {
    router.push("/projects");
  }, [router]);

  return (
    
    <Card>
<section className="min-h-screen px-6">
    <div className="max-w-6xl mx-auto text-center mb-12 flex justify-center">
      <Loader />
      
{/* <h1 className="text-3xl md:text-4xl font-bold text-[#4B5563] mb-4 self-center">AI That Calls. AI That Chats. AI That Sells.</h1> */}

      {/* <h2 className="text-3xl font-bold text-gray-800 mb-2">Meet our Agents</h2> */}
      {/* <p className="text-gray-400">See our Platform capabilities</p> */}
    </div>
    {/* <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent, index) => (
        <AgentCard key={index} imageUrl={agent.imageUrl} description={agent.description} title={agent.title} badgeText={agent.badgeText} linkText="Learn more" linkHref={agent.slug} />
      ))}
    </div> */}
    <div className="mt-8">

  </div>
  </section>

    </Card>
    );
  };
  

  export default withProtection(Home);
  