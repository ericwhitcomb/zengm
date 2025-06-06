import { Cache, connectLeague, idb } from "../db/index.ts";
import { league } from "../core/index.ts";
import {
	env,
	g,
	helpers,
	initUILocalGames,
	local,
	toUI,
	updatePhase,
	updatePlayMenu,
	updateStatus,
} from "./index.ts";
import type { Conditions, League } from "../../common/types.ts";

let heartbeatIntervalID: number;

// Heartbeat stuff would be better inside a single transaction, but Firefox doesn't like that.

const getLeague = async (lid: number) => {
	// Make sure this league exists before proceeding
	const l = await idb.meta.get("leagues", lid);

	if (l === undefined) {
		throw new Error("League not found.");
	}

	return l;
};

const runHeartbeat = async (l: League) => {
	l.heartbeatID = env.heartbeatID;
	l.heartbeatTimestamp = Date.now();
	await idb.meta.put("leagues", l);
};

const startHeartbeat = async (l: Awaited<ReturnType<typeof getLeague>>) => {
	// First one within this transaction
	await runHeartbeat(l);

	// Then in new transaction
	const lid = l.lid;
	setTimeout(() => {
		clearInterval(heartbeatIntervalID); // Shouldn't be necessary, but just in case

		heartbeatIntervalID = self.setInterval(async () => {
			const l2 = await getLeague(lid);
			await runHeartbeat(l2);
		}, 1000);
	}, 1000);
};

// Check if loaded in another tab
const checkHeartbeat = async (lid: number) => {
	const l = await getLeague(lid);
	const { heartbeatID, heartbeatTimestamp } = l;

	if (heartbeatID === undefined || heartbeatTimestamp === undefined) {
		await startHeartbeat(l);
		return;
	}

	// If this is the same active tab (like on ctrl+R), no problem
	if (env.heartbeatID === heartbeatID) {
		await startHeartbeat(l);
		return;
	}

	// Difference between now and stored heartbeat in milliseconds
	const diff = Date.now() - heartbeatTimestamp;

	// If diff is greater than 5 seconds, assume other tab was closed
	if (diff > 5 * 1000) {
		await startHeartbeat(l);
		return;
	}

	throw new Error(
		"Your browser only supports opening a league in one tab at a time. If this league is not open in another tab, please wait a few seconds and reload.",
	);
};

// beforeLeague runs when the user switches leagues (including the initial league selection).
let loadingNewLid;
export const beforeLeague = async (newLid: number, conditions?: Conditions) => {
	// Make sure league template FOR THE CURRENT LEAGUE is showing
	loadingNewLid = newLid;
	const switchingDatabaseLid = newLid !== g.get("lid");

	if (switchingDatabaseLid) {
		await league.close(true);
	}

	if (loadingNewLid !== newLid) {
		return;
	}

	// Check after every async action
	// If this is a Web Worker, only one tab of a league can be open at a time

	if (!env.useSharedWorker) {
		clearInterval(heartbeatIntervalID);
		await checkHeartbeat(newLid);
	}

	if (loadingNewLid !== newLid) {
		return;
	}

	if (switchingDatabaseLid) {
		// Clear old game attributes from g, just to be sure
		helpers.resetG();
		await toUI("resetLeague", []);

		if (loadingNewLid !== newLid) {
			return;
		}

		// Confirm league exists before proceeding
		await getLeague(newLid);
		idb.league = await connectLeague(newLid);

		// Do this after connecting to league, in case there is an error during connection, the lid will stil be in sync between worker and ui
		g.setWithoutSavingToDB("lid", newLid);

		if (loadingNewLid !== newLid) {
			return;
		}

		// Reuse existing cache, if it was just created while generating a new league
		// TEMP DISABLE WITH ESLINT 9 UPGRADE eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!idb.cache || !idb.cache.newLeague || switchingDatabaseLid) {
			// TEMP DISABLE WITH ESLINT 9 UPGRADE eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
			if (idb.cache) {
				idb.cache.stopAutoFlush();
			}

			idb.cache = new Cache();

			try {
				await idb.cache.fill();
			} catch (error) {
				// idb.cache.fill will throw an error in some situations, like if season is not in the database ("Undefined season"). In that case, we want to unset lid so the UI knows we are not in a league, otherwise it messes with error handling (see lid check in runBefore)
				// @ts-expect-error
				g.setWithoutSavingToDB("lid", undefined);

				throw error;
			}

			idb.cache.startAutoFlush();

			if (loadingNewLid !== newLid) {
				return;
			}
			// TEMP DISABLE WITH ESLINT 9 UPGRADE eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		} else if (idb.cache && idb.cache.newLeague) {
			idb.cache.newLeague = false;
		}
	}

	await league.loadGameAttributes();
	await initUILocalGames();

	if (loadingNewLid !== newLid) {
		return;
	}

	local.leagueLoaded = true;

	await updateStatus(undefined);
	if (loadingNewLid !== newLid) {
		return;
	}
	await updatePhase(conditions);
	if (loadingNewLid !== newLid) {
		return;
	}
	await updatePlayMenu();
	if (loadingNewLid !== newLid) {
		return;
	}

	// If this is a Shared Worker, only one league can be open at a time
	if (env.useSharedWorker) {
		toUI("newLid", [g.get("lid")]);
	}
};

// beforeNonLeague runs when the user clicks a link back to the dashboard while in a league. beforeNonLeagueRunning is to handle extra realtimeUpdate request triggered by stopping gameSim in league.disconnect
let beforeNonLeagueRunning = false;
export const beforeNonLeague = async (conditions: Conditions) => {
	if (!beforeNonLeagueRunning) {
		try {
			beforeNonLeagueRunning = true;
			await league.close(false);
			await toUI("resetLeague", [], conditions);

			if (!env.useSharedWorker) {
				clearInterval(heartbeatIntervalID);
			}

			beforeNonLeagueRunning = false;
		} catch (error) {
			beforeNonLeagueRunning = false;
			throw error;
		}
	}
};
