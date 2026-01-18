import { useState, FormEvent, ChangeEvent } from "react";

interface ChatInputProps {
  input?: string;
  onInputChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: (content: string) => void;
  channelName: string;
  keyboardVisible?: boolean;
  disabled?: boolean;
}

export function ChatInput({
  input: controlledInput,
  onInputChange,
  onSendMessage,
  channelName,
  keyboardVisible,
  disabled,
}: ChatInputProps) {
  const [internalInput, setInternalInput] = useState("");
  const input = controlledInput ?? internalInput;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (onInputChange) {
      onInputChange(e);
    } else {
      setInternalInput(e.target.value);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    if (!onInputChange) {
      setInternalInput("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-1 px-1 py-1 bg-irc-bg border-t border-irc-border ${
        keyboardVisible ? "" : "safe-area-bottom"
      }`}
    >
      <span className="text-irc-cyan shrink-0">[#{channelName}]</span>
      <input
        type="text"
        value={input}
        onChange={handleChange}
        placeholder=""
        disabled={disabled}
        className="flex-1 bg-transparent text-irc-white outline-none placeholder:text-irc-timestamp text-base disabled:opacity-50"
        autoComplete="off"
        spellCheck={false}
      />
    </form>
  );
}
