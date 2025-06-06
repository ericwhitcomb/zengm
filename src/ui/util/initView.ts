import type { Context } from "../router/index.ts";
import { viewManager } from "./viewManager.tsx";

type InitArgs = {
	Component: any;
	id: string;
	inLeague?: boolean;
};

const initView = (args: InitArgs) => {
	if (!args.Component) {
		throw new Error("Missing arg Component");
	}

	return async (context: Context) => {
		const viewInfo = {
			Component: args.Component,
			id: args.id,
			inLeague: !!args.inLeague,
			context,
		};

		await viewManager.fromRouter(viewInfo);
	};
};

export default initView;
