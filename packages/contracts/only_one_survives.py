# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
Only One Survives — GenLayer Intelligent Contract (lean / free-to-play)
======================================================================

This version is deliberately simple and money-free:

  * No staking, no escrow, no payouts. Players just play.
  * Players connect a wallet only for IDENTITY (their address is their entry on
    the leaderboard) — connecting is free and players never send a transaction
    or need any tokens.
  * The authoritative game server records each match result. The server pays the
    (tiny) gas for these writes, so players need zero tokens.
  * The GenLayer connection is the on-chain leaderboard + permanent match record,
    plus an AI round-picker that uses the contract's LLM to choose the next round
    and generate a playful taunt — something a normal blockchain cannot do.

`# VERIFY:` comments mark the few runtime APIs (message sender, LLM call,
equivalence principle) whose exact names you should confirm against your
installed SDK version:
  * https://docs.genlayer.com/developers/intelligent-contracts/features/calling-llms
  * https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism
  * https://docs.genlayer.com/developers/intelligent-contracts/examples/llm-hello-world-non-comparative
"""

from genlayer import *
import json

# The rounds the AI is allowed to choose from.
ROUNDS = [
    "floor_drops",
    "laser_spin",
    "shrink_zone",
    "jump_timing",
    "wind_push",
    "blackout",
]


class OnlyOneSurvives(gl.Contract):
    # --- access control -----------------------------------------------------
    owner: Address
    trusted_server: Address  # the only address allowed to report results

    # --- counters -----------------------------------------------------------
    match_count: u256

    # --- leaderboard --------------------------------------------------------
    wins: TreeMap[Address, u256]
    games: TreeMap[Address, u256]
    points: TreeMap[Address, u256]
    names: TreeMap[Address, str]

    # --- history ------------------------------------------------------------
    matches: TreeMap[u256, str]  # match_id -> JSON {winner, players, round}
    last_round: str              # most recent AI round pick {round, taunt}

    def __init__(self, trusted_server: Address):
        # VERIFY: sender accessor (gl.message.*)
        self.owner = gl.message.sender_account
        self.trusted_server = trusted_server
        self.match_count = u256(0)
        self.last_round = ""

    # =======================================================================
    #  Helpers
    # =======================================================================
    def _bump(self, table: TreeMap[Address, u256], who: Address, by: int) -> None:
        current = table.get(who) or u256(0)
        table[who] = u256(int(current) + by)

    # =======================================================================
    #  Result reporting  (server only — players never call this)
    # =======================================================================
    @gl.public.write
    def report_result(self, winner_hex: str, players_json: str, round_name: str, log_hash: str) -> u256:
        """
        The server reports a finished match.

        players_json: JSON list of {"addr": "0x..", "name": "display name"}.
        We record the match, store each player's display name, and update the
        leaderboard. Winner gets a win + bonus points; everyone gets
        participation points.
        """
        if gl.message.sender_account != self.trusted_server:
            raise Exception("only the game server can report results")

        players = json.loads(players_json)
        addrs = [p["addr"] for p in players]
        if winner_hex not in addrs:
            raise Exception("winner was not a participant")

        match_id = self.match_count
        self.matches[match_id] = json.dumps({
            "winner": winner_hex,
            "players": addrs,
            "round": round_name,
            "log_hash": log_hash,
        })
        self.match_count = u256(int(self.match_count) + 1)

        for p in players:
            who = Address(p["addr"])
            self.names[who] = p.get("name", "anon")
            self._bump(self.games, who, 1)
            self._bump(self.points, who, 10)

        winner = Address(winner_hex)
        self._bump(self.wins, winner, 1)
        self._bump(self.points, winner, 100)
        return match_id

    # =======================================================================
    #  AI round picker  — the signature GenLayer feature
    # =======================================================================
    @gl.public.write
    def pick_next_round(self) -> str:
        """
        Ask the contract's LLM to choose the next round and write a short,
        playful taunt to hype players. Returns JSON: {"round": ..., "taunt": ...}.

        This is the distinctly-GenLayer bit: an on-chain, LLM-driven decision
        reached by validator consensus. A normal smart contract can't do this.
        """
        options = ", ".join(ROUNDS)
        task = (
            f'Pick ONE round at random from this list: {options}. '
            f'Then write a short, fun one-line taunt to hype players for it '
            f'(max 12 words, no profanity). '
            f'Respond ONLY with a JSON object of the exact form '
            f'{{"round": "<one from the list>", "taunt": "<text>"}}.'
        )

        def run_llm() -> str:
            # VERIFY: LLM helper name — see features/calling-llms.
            return gl.exec_prompt(task)

        # Creative output differs across validators, so use a non-comparative
        # principle: validators agree the result is a *valid* round + reasonable
        # taunt rather than byte-identical text.
        # VERIFY: exact helper name/signature — see the non-comparative example.
        result = gl.eq_principle_prompt_non_comparative(
            run_llm,
            task="Return JSON with a valid round name from the allowed list and a short playful taunt.",
            criteria="round is one of the allowed values; taunt is short, playful, and clean.",
        )

        data = json.loads(result)
        if data.get("round") not in ROUNDS:
            data["round"] = ROUNDS[0]
        self.last_round = json.dumps(data)
        return self.last_round

    # =======================================================================
    #  Admin
    # =======================================================================
    @gl.public.write
    def set_trusted_server(self, new_server: Address) -> None:
        if gl.message.sender_account != self.owner:
            raise Exception("only owner")
        self.trusted_server = new_server

    # =======================================================================
    #  Views (read-only, free)
    # =======================================================================
    @gl.public.view
    def get_player(self, who: Address) -> str:
        return json.dumps({
            "name": self.names.get(who) or "",
            "wins": int(self.wins.get(who) or 0),
            "games": int(self.games.get(who) or 0),
            "points": int(self.points.get(who) or 0),
        })

    @gl.public.view
    def get_match(self, match_id: u256) -> str:
        return self.matches.get(match_id) or ""

    @gl.public.view
    def get_last_round(self) -> str:
        return self.last_round

    @gl.public.view
    def total_matches(self) -> int:
        return int(self.match_count)
