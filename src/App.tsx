import { LogViewer } from "@/components/logs/LogViewer";

function App() {
  return (
    <div className="mx-auto flex h-screen max-w-5xl flex-col gap-4 py-4">
      <header>
        <h1 className="text-xl font-semibold">Activity log</h1>
        <p className="text-sm text-muted-foreground">
          A live feed of what is happening. Select any line to see more.
        </p>
      </header>
      <LogViewer />
    </div>
  );
}

export default App;
