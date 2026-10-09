import Journal from "../models/JournalModel.js";
import Order from "../models/OrdersModel.js";

/**
 * Retrieves paginated, filtered, and searched trading journal entries for a user
 */
export const getJournalEntriesService = async (userId, query = {}) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(query.limit || 15)));
  const skip = (page - 1) * limit;

  const filter = { userId };

  if (query.symbol) {
    filter.symbol = String(query.symbol).trim().toUpperCase();
  }
  if (query.type && ["buy", "sell"].includes(query.type)) {
    filter.type = query.type;
  }
  if (query.strategyName) {
    filter.strategyName = new RegExp(query.strategyName, "i");
  }
  if (query.tag) {
    filter.tags = query.tag;
  }
  if (query.fromDate || query.toDate) {
    filter.entryDate = {};
    if (query.fromDate) filter.entryDate.$gte = new Date(query.fromDate);
    if (query.toDate) filter.entryDate.$lte = new Date(query.toDate);
  }

  const sortField = query.sortBy || "entryDate";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;
  const sortOptions = { [sortField]: sortOrder };

  const [entries, totalCount] = await Promise.all([
    Journal.find(filter).sort(sortOptions).skip(skip).limit(limit).populate("orderId"),
    Journal.countDocuments(filter),
  ]);

  return {
    entries,
    pagination: {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    },
  };
};

/**
 * Creates a new trading journal entry (manually or pre-filled from executed order)
 */
export const createJournalEntryService = async (userId, data) => {
  const {
    orderId,
    symbol,
    type,
    entryDate,
    exitDate,
    entryPrice,
    exitPrice,
    quantity,
    realizedPnl,
    strategyName,
    entryReason,
    exitReason,
    notes,
    lessonsLearned,
    tags,
    rating,
    ruleFollowed,
    mistakeCategory,
  } = data;

  if (!symbol || !type || !entryPrice || !quantity) {
    throw new Error("Missing required journal entry fields (symbol, type, entryPrice, quantity)");
  }

  let linkedOrder = null;
  if (orderId) {
    linkedOrder = await Order.findOne({ _id: orderId, userId });
  }

  const entry = await Journal.create({
    userId,
    orderId: linkedOrder ? linkedOrder._id : null,
    symbol: symbol.toUpperCase(),
    type: type.toLowerCase(),
    entryDate: entryDate ? new Date(entryDate) : new Date(),
    exitDate: exitDate ? new Date(exitDate) : null,
    entryPrice: Number(entryPrice),
    exitPrice: exitPrice ? Number(exitPrice) : null,
    quantity: Number(quantity),
    realizedPnl: realizedPnl !== undefined ? Number(realizedPnl) : (linkedOrder?.realizedPnl || 0),
    strategyName: strategyName || "Discretionary",
    entryReason: entryReason || "",
    exitReason: exitReason || "",
    notes: notes || "",
    lessonsLearned: lessonsLearned || "",
    tags: Array.isArray(tags) ? tags : [],
    rating: Number(rating || 3),
    ruleFollowed: ruleFollowed !== undefined ? Boolean(ruleFollowed) : true,
    mistakeCategory: mistakeCategory || "None",
  });

  return entry;
};

/**
 * Gets single journal entry by ID (with user isolation)
 */
export const getJournalEntryByIdService = async (userId, journalId) => {
  const entry = await Journal.findOne({ _id: journalId, userId }).populate("orderId");
  if (!entry) {
    throw new Error("Journal entry not found or access denied.");
  }
  return entry;
};

/**
 * Updates an existing journal entry (strictly isolates user)
 */
export const updateJournalEntryService = async (userId, journalId, updateData) => {
  const entry = await Journal.findOne({ _id: journalId, userId });
  if (!entry) {
    throw new Error("Journal entry not found or access denied.");
  }

  const allowedUpdates = [
    "strategyName",
    "entryReason",
    "exitReason",
    "notes",
    "lessonsLearned",
    "tags",
    "rating",
    "ruleFollowed",
    "mistakeCategory",
    "exitPrice",
    "exitDate",
    "realizedPnl",
  ];

  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      entry[field] = updateData[field];
    }
  });

  await entry.save();
  return entry;
};

/**
 * Deletes a journal entry safely without affecting underlying order or financial transactions
 */
export const deleteJournalEntryService = async (userId, journalId) => {
  const entry = await Journal.findOneAndDelete({ _id: journalId, userId });
  if (!entry) {
    throw new Error("Journal entry not found or access denied.");
  }
  return entry;
};

/**
 * Retrieves calendar-grouped daily trading journal activity
 */
export const getJournalCalendarService = async (userId, year, month) => {
  const targetYear = Number(year) || new Date().getFullYear();
  const targetMonth = Number(month) || new Date().getMonth() + 1; // 1-indexed

  const startDate = new Date(targetYear, targetMonth - 1, 1);
  const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const entries = await Journal.find({
    userId,
    entryDate: { $gte: startDate, $lte: endDate },
  }).sort({ entryDate: 1 });

  const calendarMap = {};

  entries.forEach((entry) => {
    const dateStr = new Date(entry.entryDate).toISOString().split("T")[0]; // YYYY-MM-DD
    if (!calendarMap[dateStr]) {
      calendarMap[dateStr] = {
        date: dateStr,
        tradeCount: 0,
        realizedPnL: 0,
        tags: new Set(),
        entries: [],
      };
    }
    calendarMap[dateStr].tradeCount++;
    calendarMap[dateStr].realizedPnL += entry.realizedPnl || 0;
    (entry.tags || []).forEach((t) => calendarMap[dateStr].tags.add(t));
    calendarMap[dateStr].entries.push(entry);
  });

  const calendarData = Object.values(calendarMap).map((d) => ({
    ...d,
    realizedPnL: Number(d.realizedPnL.toFixed(2)),
    tags: Array.from(d.tags),
  }));

  return calendarData;
};

/**
 * Returns journal analytics & self-review breakdown (rule adherence, mistakes, top tags)
 */
export const getJournalAnalyticsService = async (userId) => {
  const entries = await Journal.find({ userId });

  const totalEntries = entries.length;
  if (totalEntries === 0) {
    return {
      totalEntries: 0,
      ruleFollowedCount: 0,
      ruleFollowedPercent: 0,
      tagDistribution: [],
      mistakeDistribution: [],
      completionRatePercent: 0,
    };
  }

  let ruleFollowedCount = 0;
  let completedNotesCount = 0;
  const tagCountMap = {};
  const mistakeCountMap = {};

  entries.forEach((e) => {
    if (e.ruleFollowed) ruleFollowedCount++;
    if (e.notes || e.entryReason || e.lessonsLearned) completedNotesCount++;

    (e.tags || []).forEach((tag) => {
      tagCountMap[tag] = (tagCountMap[tag] || 0) + 1;
    });

    const mistake = e.mistakeCategory || "None";
    mistakeCountMap[mistake] = (mistakeCountMap[mistake] || 0) + 1;
  });

  const ruleFollowedPercent = Number(((ruleFollowedCount / totalEntries) * 100).toFixed(1));
  const completionRatePercent = Number(((completedNotesCount / totalEntries) * 100).toFixed(1));

  const tagDistribution = Object.entries(tagCountMap)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const mistakeDistribution = Object.entries(mistakeCountMap)
    .map(([mistake, count]) => ({ mistake, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalEntries,
    ruleFollowedCount,
    ruleFollowedPercent,
    completionRatePercent,
    tagDistribution,
    mistakeDistribution,
  };
};
