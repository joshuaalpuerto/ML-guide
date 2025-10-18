"use client";
import { useState } from 'react';
import ChatInterface from "@/components/chat/ChatInterface";
import FileUpload from '@/components/upload/FileUpload';
import { UserCVParsed } from '@/types/user-data';

export default function Home() {
  const [userCVParsedProfile, setUserCVParsedProfile] = useState<UserCVParsed | null>({
    "skills": [
      "React",
      "NextJS",
      "Redux",
      "GraphQL",
      "Javascript",
      "Typescript",
      "HTML5",
      "CSS3",
      "Tailwind CSS",
      "Material UI",
      "Chakra-UI",
      "styled-components",
      "theme-ui",
      "emotion",
      "Responsive Design",
      "Cross-browser Compatibility",
      "Webpack",
      "Parcel",
      "Roll-up",
      "NodeJS",
      "Express",
      "REST APIs",
      "Python",
      "FastAPI",
      "PHP",
      "MySQL",
      "PostgreSQL",
      "MongoDB",
      "REST",
      "GraphQL",
      "CI/CD Pipelines",
      "Github Actions",
      "CircleCI",
      "TravisCI",
      "Docker",
      "ReactNative",
      "Crashlytics",
      "CodePush",
      "Langchain",
      "Langgraph",
      "OpenAI",
      "Fireworks",
      "Precision/Recall",
      "ROUGE",
      "WER",
      "Jest",
      "Cypress",
      "Playwright",
      "Enzyme",
      "Sentry",
      "GCP",
      "logs/trace explorer",
      "logs analyzer",
      "Honeycomb",
      "logrocket",
      "Google Cloud Platform",
      "Netlify",
      "Vercel",
      "Heroku",
      "Machine Learning",
      "Functional Programming",
      "Automation/Productivity"
    ],
    "workExperience": [
      {
        "companyName": "Jobbatical",
        "startDate": "Jun 2019",
        "endDate": "Jul 2025",
        "summary": "Senior Software Engineer at Jobbatical in Tallinn, Estonia. Improved gross margin by 30% by reducing message composition time through AI: Enhanced RAG pipeline, fine-tuned BERT for importance prediction, upgraded autocomplete (n-gram & T5/GPT2), and implemented Speech-to-Text (Deepgram). Help engineered a visa eligibility tool using an LLM workflow (data extraction/mapping to JSON) that allows seamless case additions & directly increasing our service revenue. Involved in project planning and preparation to aid in closing knowledge gaps within the team, allowing for quicker delivery and more productivity. Improved user experience by simplifying feedback mechanisms with pre-populated answers, boosting user satisfaction scores from 3.6 to 4.5/5. Optimized our application performance, both on the client side(React) and backend(MongoDB and GraphQL) This ensures a seamless and efficient user experience. Mainly working on React(NextJS), NodeJS, MongoDB, Postgres, GraphQL, Python, OpenAI, Langchain/Langgraph."
      },
      {
        "companyName": "Social Offshore",
        "startDate": "May 2016",
        "endDate": "May 2019",
        "summary": "Senior Full Stack Developer at Social Offshore in Eastwood, Quezon City. Improve developer experience by integrating CI/CD pipelines into new projects, allowing for automated building, testing, and deployment of software to production. Apply Domain-Driven Design (DDD) principles that allow us to deliver features with consistent velocity. Recommended and implemented Progressive Web App (PWA) technology to enhance user experience, leading to increased engagement and retention. Optimized the performance of a data-heavy client application by using various optimization techniques, resulting in reduced load times and improved overall application speed and responsiveness. Mainly working on React, Redux, Node, Postgres, Firebase & PWA stack."
      },
      {
        "companyName": "Activemindz /SyncIT",
        "startDate": "Apr 2014",
        "endDate": "Apr 2016",
        "summary": "Senior Web Developer at Activemindz /SyncIT in Visayas Ave, Quezon City. Learned PhoneGap to develop mobile applications for clients hence expanding the range of services offered by the company. Led a project focused on Server and Client architecture (SPA), resulting in a significant improvement in developer experience and overall code quality. Led team and coordinated with clients to gather and execute requirements. Recommended third-party solutions instead of costly custom development to reduce cost."
      },
      {
        "companyName": "Lifeware Technology Inc.",
        "startDate": "Apr 2013",
        "endDate": "March 2014",
        "summary": "Web Developer at Lifeware Technology Inc. in Eastwood, Quezon City. Acquired knowledge and skill to integrate GSM modem to power web applications for disaster management, which contributed to public safety through partnership with the Government. As a junior and solo developer, I successfully took ownership of projects and timelines, delivering projects within given deadlines. Developed a thorough understanding of the software development cycle, including requirement gathering, design, development, testing, and deployment."
      }
    ],
    "education": [
      ""
    ]
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl h-[75vh] border rounded-lg shadow-lg bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
        {!userCVParsedProfile ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">Upload Your CV</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto">
                Before we start the conversation, please upload your CV. We will extract your skills & experience to personalize company research and role recommendations.
              </p>
            </div>
            <FileUpload
              onUploaded={(info) => {
                if (info.profile) setUserCVParsedProfile(info.profile);
              }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">Your file is processed securely and not shared externally.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full w-full">
            <div className="px-4 py-2 text-xs bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 flex flex-col gap-1">
              {userCVParsedProfile && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400">Parsed {userCVParsedProfile.skills?.length || 0} skills, {userCVParsedProfile.workExperience?.length || 0} work experience entries, {userCVParsedProfile.education?.length || 0} education entries.</span>
              )}
            </div>
            {/* Chat wrapper needs min-h-0 so the internal CardContent overflow-y-auto can scroll */}
            <div className="flex flex-col flex-1 min-h-0">
              <ChatInterface userCVInfo={userCVParsedProfile} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
