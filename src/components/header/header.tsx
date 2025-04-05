
import DBConnectionDialog from "./select-db-connection";
import { Trash } from "lucide-react";
import AiConfigDialog from "./select-ai-model";
import { Button } from "../ui/button";

export default function Header() {
    return (
        <header className="border-b border-border p-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold">AI SQL Generator</h1>

            <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon">
                    <Trash className="h-5 w-5" />
                </Button>

                <div className="flex items-center space-x-2">
                    <DBConnectionDialog />
                    <AiConfigDialog/>

                    <div className="text-sm text-muted-foreground">No Schema Loaded</div>
                </div>
            </div>
        </header>
    )
}
