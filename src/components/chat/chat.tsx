import { Card, CardContent, CardFooter, CardHeader } from "../ui/card"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { Textarea } from "../ui/textarea"



export default function Chat() {
    return (
        <>
            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4 max-w-4xl mx-auto">
                    {/* SQL Message */}
                    <Card>
                        <CardHeader className="pb-2">
                            <h3 className="text-sm font-medium">Generated SQL</h3>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                                {`-- SQL query will appear here --`}
                            </pre>
                        </CardContent>
                        <CardFooter>
                            <Button disabled>Execute</Button>
                        </CardFooter>
                    </Card>

                    {/* Result Message */}
                    <Card>
                        <CardHeader className="pb-2">
                            <h3 className="text-sm font-medium">Results after running query</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-muted p-4 rounded-md text-center text-muted-foreground">
                                Run a query to see results
                            </div>
                        </CardContent>
                    </Card>

                    {/* Another SQL Message */}
                    <Card>
                        <CardHeader className="pb-2">
                            <h3 className="text-sm font-medium">The next Generated SQL query</h3>
                        </CardHeader>
                        <CardContent>
                            <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                                {`-- Next SQL query will appear here --`}
                            </pre>
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border p-4">
                <div className="max-w-4xl mx-auto flex">
                    <Textarea
                        className="min-h-[80px] flex-1 resize-none"
                        placeholder="Enter your natural language query here..."
                    />
                    <Button className="ml-2 self-end">Submit</Button>
                </div>
            </div>


        </>
    )
}

