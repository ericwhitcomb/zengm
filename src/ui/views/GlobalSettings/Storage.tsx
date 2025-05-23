import clsx from "clsx";
import { type MouseEvent, useCallback, useEffect, useState } from "react";
import { GAME_NAME, WEBSITE_ROOT } from "../../../common/index.ts";

const Storage = () => {
	const [status, setStatus] = useState<
		| "enabled"
		| "disabled"
		| "failed"
		| "loading..."
		| "not supported by your browser"
	>("loading...");

	useEffect(() => {
		let mounted = true;

		const check = async () => {
			if (navigator.storage?.persisted) {
				const persisted = await navigator.storage.persisted();

				if (!mounted) {
					return;
				}

				if (persisted) {
					setStatus("enabled");
				} else {
					setStatus("disabled");
				}
			} else {
				setStatus("not supported by your browser");
			}
		};

		check();

		return () => {
			mounted = false;
		};
	}, []);

	const onClick = useCallback(async (event: MouseEvent) => {
		event.preventDefault();

		if (navigator.storage?.persist) {
			setStatus("loading...");

			const persisted = await navigator.storage.persist();
			if (persisted) {
				setStatus("enabled");
			} else {
				// https://stackoverflow.com/questions/51657388/request-persistent-storage-permissions
				setStatus("failed");
			}
		} else {
			setStatus("not supported by your browser");
		}
	}, []);

	return (
		<>
			<p>
				Since {GAME_NAME} stores game data in your browser profile,{" "}
				<a
					href={`https://${WEBSITE_ROOT}/manual/faq/#missing-leagues`}
					target="_blank"
				>
					sometimes it can be inadvertently deleted
				</a>
				. Enabling persistent storage helps protect against this.
			</p>
			<p>
				Status:{" "}
				<span
					className={clsx({
						"text-success": status === "enabled",
						"text-danger": status === "disabled" || status === "failed",
					})}
				>
					{status}
				</span>
			</p>
			{status === "failed" ? (
				<p>
					Sorry, this feature can be tricky to get working in some browsers. If
					you bookmark this page or add {GAME_NAME} to your home screen, it
					might work if you press "Enable" again. Otherwise, check back later
					after playing more and maybe it will work.
				</p>
			) : null}
			{status === "loading..." ||
			status === "disabled" ||
			status === "failed" ? (
				<button
					className="btn btn-light-bordered"
					disabled={status === "loading..."}
					onClick={onClick}
				>
					Enable
				</button>
			) : null}
		</>
	);
};

export default Storage;
