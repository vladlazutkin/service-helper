import webpush from 'web-push';

const publicVapidKey =
  'BFxefyAh-0sgU-1bx5F4E8eO82k9GoRwr4yYtBTrG6Dq2dFGMiNwEvQc0nBor09sMvuaDT-52fWf9EzOC7D45P8';
const privateVapidKey = '9sh-lUM27d1R1ou07DCRcxxR2jb_TMYNJYuJ30WP6sA';

export const createVapidDetails = () => {
  webpush.setVapidDetails(
    'mailto:vladlazuthin@gmail.com',
    publicVapidKey,
    privateVapidKey
  );
};
