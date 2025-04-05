import React from 'react';

interface MessageBase {
  type: string;
}

interface UserMessage extends MessageBase {
  type: 'user';
  content: string;
}

interface SqlMessage extends MessageBase {
  type: 'sql';
  content: string;
}

interface ResultMessage extends MessageBase {
  type: 'result';
  content: {
    rows: any[];
    rowCount: number;
    fields: { name: string; dataTypeID: number }[];
  };
}

interface ErrorMessage extends MessageBase {
  type: 'error';
  content: string;
}

type Message = UserMessage | SqlMessage | ResultMessage | ErrorMessage;

interface ChatWindowProps {
  messages: Message[];
  onExecuteQuery: (sql: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onExecuteQuery }) => {
  // Render a user message
  const renderUserMessage = (message: UserMessage) => (
    <div className="p-4 bg-blue-50 rounded-lg max-w-2xl">
      <p className="text-gray-800">{message.content}</p>
    </div>
  );

  // Render an SQL message with the option to execute it
  const renderSqlMessage = (message: SqlMessage) => (
    <div className="p-4 bg-gray-50 rounded-lg max-w-3xl">
      <h3 className="text-gray-700 font-semibold mb-2">Generated SQL</h3>
      <div className="bg-gray-800 text-white p-3 rounded-md font-mono text-sm overflow-x-auto">
        {message.content}
      </div>
      <div className="mt-3">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm"
          onClick={() => onExecuteQuery(message.content)}
        >
          Execute Query
        </button>
      </div>
    </div>
  );

  // Render query results
  const renderResultMessage = (message: ResultMessage) => (
    <div className="p-4 bg-green-50 rounded-lg max-w-4xl overflow-x-auto">
      <h3 className="text-gray-700 font-semibold mb-2">Query Results</h3>
      {message.content.rows.length === 0 ? (
        <div className="text-gray-500 italic">No results returned</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {message.content.fields.map((field, i) => (
                    <th
                      key={i}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {field.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {message.content.rows.map((row, i) => (
                  <tr key={i}>
                    {message.content.fields.map((field, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row[field.name]?.toString() ?? 'NULL'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {message.content.rowCount} {message.content.rowCount === 1 ? 'row' : 'rows'} returned
          </div>
        </>
      )}
    </div>
  );

  // Render an error message
  const renderErrorMessage = (message: ErrorMessage) => (
    <div className="p-4 bg-red-50 rounded-lg max-w-2xl">
      <h3 className="text-red-700 font-semibold mb-1">Error</h3>
      <p className="text-red-600">{message.content}</p>
    </div>
  );

  return (
    <div className="flex flex-col flex-grow overflow-y-auto p-4 space-y-6">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-lg">Ask a question to generate SQL from your database</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <div key={index} className="flex flex-col">
            <div
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {(() => {
                switch (message.type) {
                  case 'user':
                    return renderUserMessage(message as UserMessage);
                  case 'sql':
                    return renderSqlMessage(message as SqlMessage);
                  case 'result':
                    return renderResultMessage(message as ResultMessage);
                  case 'error':
                    return renderErrorMessage(message as ErrorMessage);
                  default:
                    return null;
                }
              })()}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ChatWindow; 