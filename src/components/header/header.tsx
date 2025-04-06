import AiConfigDialog from "./select-ai-model";
import DBConnectionDialog from "./select-db-connection";

export default function Header() {
  return (
    <div className="border-border flex w-full items-center justify-between p-4">
      <h1 className="text-xl font-semibold">AI SQL Generator</h1>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <DBConnectionDialog />
          <AiConfigDialog />
        </div>
      </div>
    </div>
  );
}
