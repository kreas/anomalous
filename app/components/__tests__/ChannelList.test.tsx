import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChannelList, ChannelListItem } from "../ChannelList";

describe("ChannelList", () => {
  const mockChannels: ChannelListItem[] = [
    { id: "1", name: "lobby", unreadCount: 0 },
    { id: "2", name: "mysteries", unreadCount: 3 },
    { id: "3", name: "tech-support", unreadCount: 0 },
  ];

  it("renders all channels", () => {
    render(
      <ChannelList
        channels={mockChannels}
        activeChannelId="1"
        onChannelSelect={() => {}}
      />,
    );

    expect(screen.getByText("#lobby")).toBeInTheDocument();
    expect(screen.getByText("#mysteries")).toBeInTheDocument();
    expect(screen.getByText("#tech-support")).toBeInTheDocument();
  });

  it("shows unread count badge for channels with unread messages", () => {
    render(
      <ChannelList
        channels={mockChannels}
        activeChannelId="1"
        onChannelSelect={() => {}}
      />,
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("calls onChannelSelect when a channel is clicked", async () => {
    const user = userEvent.setup();
    const onChannelSelect = vi.fn();

    render(
      <ChannelList
        channels={mockChannels}
        activeChannelId="1"
        onChannelSelect={onChannelSelect}
      />,
    );

    await user.click(screen.getByText("#mysteries"));

    expect(onChannelSelect).toHaveBeenCalledWith("2");
  });

  it("highlights the active channel with >> indicator", () => {
    render(
      <ChannelList
        channels={mockChannels}
        activeChannelId="1"
        onChannelSelect={() => {}}
      />,
    );

    expect(screen.getByText(">>")).toBeInTheDocument();
  });

  it("shows close button when onClose is provided", () => {
    render(
      <ChannelList
        channels={mockChannels}
        activeChannelId="1"
        onChannelSelect={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("[x]")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ChannelList
        channels={mockChannels}
        activeChannelId="1"
        onChannelSelect={() => {}}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByText("[x]"));

    expect(onClose).toHaveBeenCalled();
  });
});
