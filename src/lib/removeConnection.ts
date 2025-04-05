import  {ConnectionDetails}  from '@/hooks/useDbConnections';

export function removeConnection(
  id: string,
  connections: ConnectionDetails[],
  setConnections: (connections: ConnectionDetails[]) => void
) {
  const updated = connections.filter((conn) => conn.id !== id);
  setConnections(updated); // updates state in your component
  localStorage.setItem('databaseConnections', JSON.stringify(updated)); // keep localStorage in sync
}