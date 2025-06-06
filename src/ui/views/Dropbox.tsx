import { realtimeUpdate, safeLocalStorage } from "../util/index.ts";

const Dropbox = () => {
	const hash = location.hash.slice(1);
	const params = new URLSearchParams(hash);
	const lid = Number.parseInt(params.get("state")!);
	const accessToken = params.get("access_token");
	if (accessToken && !Number.isNaN(lid)) {
		safeLocalStorage.setItem("dropboxAccessToken", accessToken);
		realtimeUpdate(["firstRun"], `/l/${lid}/export_league`);
	}

	return <>Redirecting...</>;
};

export default Dropbox;
