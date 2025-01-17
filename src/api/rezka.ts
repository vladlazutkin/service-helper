import express from 'express';
import { logger } from '../logger';
import { clearTrash } from '../helpers/rezka';
import parse from 'node-html-parser';
import { RezkaDataModel } from '../models/rezka-data';
import { getCdnSeries, searchRezka } from '../external-api/rezka';
import { getConfig } from '../external-api/python';

const router = express.Router();

router.get('/get-link', async (req, res) => {
  try {
    const queryStr = require('url').parse(req.url).query;
    const { link, type, translatorId, season, episode, id, skipCache } =
      req.query;

    logger.info(
      `Received params: ${JSON.stringify({
        link,
        type,
        translatorId,
        season,
        episode,
      })}`
    );
    logger.info(`Skip cache: ${skipCache}`);

    const cachedData = await RezkaDataModel.findOne({ key: queryStr });
    if (cachedData && !skipCache) {
      logger.info(`Getting data for ${queryStr} from cache`);
      return res.status(200).json(JSON.parse(cachedData.data));
    }

    if (
      (episode && translatorId && season) ||
      (type === 'video.movie' && translatorId)
    ) {
      logger.info(`Getting video streams for query ${queryStr}}`);

      const { data: response } = await getCdnSeries({
        translatorId: translatorId as string,
        type: type as string,
        id: id as string,
        season: season as string,
        episode: episode as string,
      });

      logger.info(`Response from rezka: ${JSON.stringify(response)}`);

      if (!response.success || !response.url) {
        logger.info(`Error for query ${queryStr}: ${JSON.stringify(response)}`);
        return res.status(500).json({ message: response.message || 'Error' });
      }

      const data = clearTrash(response.url);

      const parsed = data
        .split('[')
        .slice(1)
        .reduce((acc, item) => {
          const quality = item.slice(0, item.indexOf(']'));
          const links = item
            .slice(item.indexOf(']') + 1)
            .split(' or ')
            .map((link) => link.replace(/,$/, ''));

          return {
            ...acc,
            [quality]: links.find((link) => link.endsWith('mp4')),
          };
        }, {});

      await RezkaDataModel.deleteMany({
        key: queryStr,
      });
      await RezkaDataModel.create({
        key: queryStr,
        data: JSON.stringify(parsed),
      });

      logger.info(
        `Video streams for query ${queryStr}: ${JSON.stringify(parsed)}`
      );

      return res.status(200).json(parsed);
    }

    logger.info(`Getting config for query ${queryStr}`);

    const { data } = await getConfig(link as string);

    const parsed = { ...data };
    parsed.translators = Object.entries(parsed.translators).reduce(
      (acc: any, [key, value]) => {
        return [
          ...acc,
          {
            id: value,
            title: key,
          },
        ];
      },
      []
    );

    parsed.seasons = formatSeasons(parsed.seasons);

    logger.info(`Config for query ${queryStr}: ${JSON.stringify(parsed)}`);

    await RezkaDataModel.deleteMany({
      key: queryStr,
    });
    await RezkaDataModel.create({
      key: queryStr,
      data: JSON.stringify(parsed),
    });

    return res.status(200).json(parsed);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.get('/cache', async (req, res) => {
  try {
    const cachedData = await RezkaDataModel.find();

    return res.status(200).json(cachedData);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.delete('/cache/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await RezkaDataModel.findByIdAndDelete(id);

    return res.status(200).json({ message: 'success' });
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.get('/check-cache', async (req, res) => {
  try {
    const queryStr = require('url').parse(req.url).query;
    const cachedData = await RezkaDataModel.findOne({ key: queryStr });

    return res.status(200).json(!!cachedData);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { search } = req.query;
    const searchKey = `search-${search}`;
    const skipCache = req.headers['Cache-Policy'] === 'no-cache';

    const cachedData = await RezkaDataModel.findOne({ key: searchKey });
    if (cachedData && !skipCache) {
      logger.info(`Getting data for search ${search} from cache`);
      return res.status(200).json(JSON.parse(cachedData.data));
    }

    const { data } = await searchRezka(search as string);

    const root = parse(data);

    const parsed = root
      .querySelectorAll('.b-content__inline_items .b-content__inline_item')
      .map((el) => ({
        name: el.querySelector('.b-content__inline_item-link a')?.innerHTML,
        href: el
          .querySelector('.b-content__inline_item-cover a')
          ?.getAttribute('href'),
        cover: el
          .querySelector('.b-content__inline_item-cover a img')
          ?.getAttribute('src'),
      }));

    await RezkaDataModel.deleteMany({
      key: searchKey,
    });
    await RezkaDataModel.create({
      key: searchKey,
      data: JSON.stringify(parsed),
    });

    return res.status(200).json(parsed);
  } catch (e: any) {
    const message = e.message || e.msg || 'Error';
    logger.error(message);
    res.status(500).json({ error: message });
  }
});

const formatSeasons = (seasons: any[]) => {
  return Object.values(seasons).reduce((acc: any[], value: any) => {
    return [
      ...acc,
      {
        ...value,
        seasons: Object.entries(value.seasons).reduce(
          (acc1: any, [key1, value1]: any) => {
            return [
              ...acc1,
              {
                id: key1,
                title: value1,
              },
            ];
          },
          []
        ),
        episodes: Object.entries(value.episodes).reduce(
          (acc2, [key2, value2]: any) => {
            return {
              ...acc2,
              [key2]: Object.entries(value2).reduce(
                (acc3: any, [key3, value3]) => {
                  return [
                    ...acc3,
                    {
                      id: key3,
                      title: value3,
                    },
                  ];
                },
                []
              ),
            };
          },
          {}
        ),
      },
    ];
  }, []);
};

export default router;
