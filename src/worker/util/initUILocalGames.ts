import g from "./g.ts";
import getProcessedGames from "./getProcessedGames.ts";
import toUI from "./toUI.ts";
import type { LocalStateUI } from "../../common/types.ts";
import { getUpcoming } from "../views/schedule.ts";

const initUILocalGames = async () => {
	const userTid = g.get("userTid");

	// Start with completed games
	const games: LocalStateUI["games"] = (
		await getProcessedGames({
			tid: userTid,
			season: g.get("season"),
			includeAllStarGame: true,
		})
	).map((game) => ({
		forceWin: game.forceWin,
		gid: game.gid,
		overtimes: game.overtimes,
		numPeriods: game.numPeriods,
		teams: [
			{
				ovr: game.teams[0].ovr,
				pts: game.teams[0].pts,
				sPts: game.teams[0].sPts,
				tid: game.teams[0].tid,
				playoffs: game.teams[0].playoffs,
			},
			{
				ovr: game.teams[1].ovr,
				pts: game.teams[1].pts,
				sPts: game.teams[1].sPts,
				tid: game.teams[1].tid,
				playoffs: game.teams[1].playoffs,
			},
		],
	}));
	games.reverse();

	// Add upcoming games
	const upcoming = await getUpcoming({ tid: userTid });
	for (const game of upcoming) {
		games.push({
			finals: game.finals,
			gid: game.gid,
			teams: [
				{
					ovr: game.teams[0].ovr,
					tid: game.teams[0].tid,
					playoffs: game.teams[0].playoffs,
				},
				{
					ovr: game.teams[1].ovr,
					tid: game.teams[1].tid,
					playoffs: game.teams[1].playoffs,
				},
			],
		});
	}

	await toUI("updateLocal", [
		{
			games,
		},
	]);
};

export default initUILocalGames;
