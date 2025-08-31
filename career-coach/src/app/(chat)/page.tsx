import ChatInterface from "@/components/chat/ChatInterface";

export default function Home() {
  return (
    <main className="flex h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-2xl h-[70vh] border rounded-lg shadow-lg bg-white dark:bg-gray-800">
        <ChatInterface />
      </div>
    </main>
  );
}
