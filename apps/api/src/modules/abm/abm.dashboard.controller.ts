import { StatusCodes } from 'http-status-codes';

import { getAbmDashboard } from './abm.dashboard.service';

export const getAbmDashboardController = async (req: { query: { from?: string; to?: string } }, res: { status: (code: number) => { json: (body: unknown) => void } }) => {
  const dashboard = await getAbmDashboard({
    from: req.query.from,
    to: req.query.to,
  });

  res.status(StatusCodes.OK).json({ dashboard });
};
