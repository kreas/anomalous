---
template: character-card
---

```json
{
  "spec": "chara_card_v2",
  "spec_version": "2.0",
  "data": {
    "name": "Character Name",
    "description": "Short one‑line hook for the character.",
    "personality": "Concise personality summary: key traits, speaking style, core motivations.",
    "scenario": "World/setting + current situation for {{char}} and {{user}}.",
    "first_mes": "{{char}} greets {{user}} here in 2–4 sentences, showing personality and context.",
    "mes_example": "<START>\n{{user}}: Hi.\n{{char}}: *Example of how {{char}} talks and emotes*\n\n<START>\n{{user}}: Another example.\n{{char}}: *Show a different mood or situation*",
    "creator_notes": "Notes for you: constraints, NSFW rules, lore structure, or model tips.",
    "tags": ["original", "template"],
    "creator": "YourName",
    "character_version": "1.0",
    "system_prompt": "",
    "post_history_instructions": "",
    "alternate_greetings": [],
    "extensions": {
      "depth_prompt": {
        "prompt": "",
        "seed": 0
      }
    }
  }
}
```