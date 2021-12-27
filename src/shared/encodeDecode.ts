import { useMemo } from 'react';
import { useLocation, useMatch } from 'react-router-dom';
import { getQueryParamsAsObject, removeUndefined } from './helpers';

export const useDecodedLocation = () => {
  const { search, ...rest } = useLocation();

  const decodedSearch = useMemo(() => getQueryParamsAsObject(search), [search]);

  return { search: decodedSearch, ...rest };
};

export const useDecodedRouteMatch = (path: string) => {
  const match = useMatch(path);
  match?.params;

  const decodedParams = useMemo(
    () => decodeValues(match?.params as Record<string, string>),
    [match?.params],
  );

  return { params: decodedParams };
};

export const decodeValues = (obj: Record<string, string>) => {
  const data = Object.keys(obj).reduce((acc, key) => {
    acc[key] = obj[key] && decodeURIComponent(obj[key] as string);
    return acc;
  }, {} as Record<string, string>);

  return data;
};

export const encodeValues = <T extends Record<string, string | string[]>>(obj: T) => {
  const data = Object.entries(removeUndefined(obj)).reduce((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.map(encodeURIComponent);
    } else {
      acc[key] = value && encodeURIComponent(value);
    }

    return acc;
  }, {} as Record<string, string | string[]>);

  return data as T;
};
