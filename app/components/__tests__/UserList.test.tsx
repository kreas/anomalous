import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserList, User } from "../UserList";

describe("UserList", () => {
  const mockUsers: User[] = [
    { id: "1", username: "Grok", status: "online", mode: "@" },
    { id: "2", username: "NightOwl44", status: "online", mode: "+" },
    { id: "3", username: "DataMiner", status: "online" },
    { id: "4", username: "GhostInShell", status: "away" },
    { id: "5", username: "ShadowNet", status: "offline" },
  ];

  it("renders all users", () => {
    render(<UserList users={mockUsers} />);

    expect(screen.getByText(/Grok/)).toBeInTheDocument();
    expect(screen.getByText(/NightOwl44/)).toBeInTheDocument();
    expect(screen.getByText(/DataMiner/)).toBeInTheDocument();
    expect(screen.getByText(/GhostInShell/)).toBeInTheDocument();
    expect(screen.getByText(/ShadowNet/)).toBeInTheDocument();
  });

  it("displays user count", () => {
    render(<UserList users={mockUsers} />);

    expect(screen.getByText("5 users")).toBeInTheDocument();
  });

  it("shows mode symbols for users with modes", () => {
    render(<UserList users={mockUsers} />);

    expect(screen.getByText("@")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  it("shows close button when onClose is provided", () => {
    render(<UserList users={mockUsers} onClose={() => {}} />);

    expect(screen.getByText("[x]")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<UserList users={mockUsers} onClose={onClose} />);

    await user.click(screen.getByText("[x]"));

    expect(onClose).toHaveBeenCalled();
  });

  it("renders empty user list", () => {
    render(<UserList users={[]} />);

    expect(screen.getByText("0 users")).toBeInTheDocument();
  });
});
