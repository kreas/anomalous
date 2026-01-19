import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessage, Message } from "../ChatMessage";

describe("ChatMessage", () => {
  const baseMessage: Message = {
    id: "1",
    timestamp: new Date("2024-01-15T14:30:00"),
    username: "TestUser",
    content: "Hello, world!",
    type: "message",
  };

  it("renders a regular message with username and content", () => {
    render(<ChatMessage message={baseMessage} />);

    // Username is wrapped in angle brackets
    expect(screen.getByText(/TestUser/)).toBeInTheDocument();
    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
  });

  it("renders join message correctly", () => {
    const joinMessage: Message = {
      ...baseMessage,
      type: "join",
      content: "",
    };

    render(<ChatMessage message={joinMessage} />);

    expect(
      screen.getByText("TestUser has joined the channel"),
    ).toBeInTheDocument();
    expect(screen.getByText("-->")).toBeInTheDocument();
  });

  it("renders leave message correctly", () => {
    const leaveMessage: Message = {
      ...baseMessage,
      type: "leave",
      content: "",
    };

    render(<ChatMessage message={leaveMessage} />);

    expect(
      screen.getByText("TestUser has left the channel"),
    ).toBeInTheDocument();
    expect(screen.getByText("<--")).toBeInTheDocument();
  });

  it("renders nick change message correctly", () => {
    const nickMessage: Message = {
      ...baseMessage,
      type: "nick",
      oldNick: "OldName",
      username: "NewName",
      content: "",
    };

    render(<ChatMessage message={nickMessage} />);

    expect(
      screen.getByText("OldName is now known as NewName"),
    ).toBeInTheDocument();
  });

  it("renders system message correctly", () => {
    const systemMessage: Message = {
      ...baseMessage,
      type: "system",
      username: "SYSTEM",
      content: "Welcome to the channel",
    };

    render(<ChatMessage message={systemMessage} />);

    expect(screen.getByText("Welcome to the channel")).toBeInTheDocument();
  });

  it("renders action message correctly", () => {
    const actionMessage: Message = {
      ...baseMessage,
      type: "action",
      content: "waves hello",
    };

    render(<ChatMessage message={actionMessage} />);

    expect(screen.getByText("TestUser")).toBeInTheDocument();
    expect(screen.getByText("waves hello")).toBeInTheDocument();
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("displays formatted timestamp", () => {
    render(<ChatMessage message={baseMessage} />);

    // The timestamp format is [HH:MM]
    expect(screen.getByText(/\[14:30\]/)).toBeInTheDocument();
  });
});
