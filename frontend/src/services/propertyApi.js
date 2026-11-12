import api from "./api";

/**
 * Fetch every page returned by the paginated "my properties" endpoint.
 * The API currently returns 10 properties per page, so reading only the
 * first response silently hides later listings from the agent UI.
 */
export const getAllMyProperties = async () => {
  const properties = [];
  let nextPage = "/properties/my-properties/";

  while (nextPage) {
    const response = await api.get(nextPage);
    const data = response.data;

    if (Array.isArray(data)) {
      properties.push(...data);
      break;
    }

    properties.push(...(data.results || []));

    if (data.next) {
      const nextUrl = new URL(data.next, api.defaults.baseURL);
      nextPage = `/properties/my-properties/${nextUrl.search}`;
    } else {
      nextPage = null;
    }
  }

  return properties;
};
