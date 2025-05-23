import { helpers } from "../../../ui/util/index.ts";

const Player = ({
	i,
	p,
	season,
	userTid,
}: {
	i: number;
	p: any;
	season: number;
	userTid: number;
}) => {
	if (!p) {
		return <div />;
	}

	let pos = p.pos;
	if (i === 24) {
		pos = "KR";
	} else if (i === 25) {
		pos = "PR";
	}

	// The wrapper div here actually matters, don't change to fragment!
	return (
		<div className="d-flex">
			<div style={{ minWidth: 20 }}>{pos}</div>
			<div>
				<span className={p.tid === userTid ? "table-info" : undefined}>
					<a href={helpers.leagueUrl(["player", p.pid])}>{p.name}</a> (
					<a
						href={helpers.leagueUrl(["roster", `${p.abbrev}_${p.tid}`, season])}
					>
						{p.abbrev}
					</a>
					)
				</span>
				<br />
				{p.keyStats}
			</div>
		</div>
	);
};

const Teams = ({
	className,
	name,
	season,
	team,
	userTid,
}: {
	className?: string;
	name: string;
	season: number;
	team: any[];
	userTid: number;
}) => {
	return (
		<div className={className}>
			<h2>{name}</h2>
			{team.filter(Boolean).map((p, i) => (
				<Player key={i} i={i} p={p} season={season} userTid={userTid} />
			))}
		</div>
	);
};

export default Teams;
