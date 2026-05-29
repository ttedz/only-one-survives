"""
Basic tests for the lean Only One Survives contract.

Run with GenLayer's test tooling (gltest). See:
  https://docs.genlayer.com/developers/intelligent-contracts/testing

These document expected behaviour; fill in fixtures for your installed version.
"""

from pathlib import Path

CONTRACT = Path(__file__).parent / "only_one_survives.py"


def test_only_server_reports_result(setup_validators, deploy_contract):
    """A non-server account cannot report a result."""
    # with pytest.raises(Exception):
    #     contract.report_result(winner, players_json, "floor_drops", "0xhash").execute(account=alice)
    pass


def test_result_updates_leaderboard(setup_validators, deploy_contract):
    """After report_result, winner has +1 win and everyone has +1 game."""
    # contract.report_result(alice, players_json, "floor_drops", "0xhash").execute(account=server)
    # stats = json.loads(contract.get_player(alice).call())
    # assert stats["wins"] == 1 and stats["games"] == 1
    pass


def test_pick_next_round_returns_valid_round(setup_validators, deploy_contract):
    """The AI round picker returns a round from the allowed list + a taunt."""
    # raw = contract.pick_next_round().execute(account=server)
    # data = json.loads(raw)
    # assert data["round"] in ["floor_drops","laser_spin","shrink_zone","jump_timing","wind_push","blackout"]
    # assert isinstance(data["taunt"], str)
    pass
