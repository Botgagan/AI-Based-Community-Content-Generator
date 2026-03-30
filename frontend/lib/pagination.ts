export const PAGINATION_DEFAULT_PAGE = 1;
export const PAGINATION_DEFAULT_LIMIT = 10;
export const THEMES_ALL_FETCH_LIMIT = 1000;

export function hasNextPageByLength(itemsLength: number, pageSize = PAGINATION_DEFAULT_LIMIT) {
  return itemsLength === pageSize;
}
