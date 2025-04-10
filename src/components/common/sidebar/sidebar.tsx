import { useRenameChatDialog } from "@/components/dialog/rename-chat-dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import FavouriteChats from "./favourite-chats";
import NewChatButton from "./new-chat-button";
import RecentChats from "./recent-chats";

export default function AppSidebar() {
  const { RenameChatDialog } = useRenameChatDialog();

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="my-3 ml-1 flex items-center">
            <h1 className="text-xl font-medium text-neutral-800">OtterDB</h1>
          </div>
        </SidebarHeader>
        <NewChatButton />
        <SidebarContent className="">
          <SidebarMenu>
            <FavouriteChats />
            <RecentChats />
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <RenameChatDialog />
    </>
  );
}
