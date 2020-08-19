import React from 'react';

import { IMy, GET_MY_PERSON_QUERY } from './Queries';
import { useQuery } from '@apollo/client';

// @TODO: Promote to erkenningen/auth library?

export enum Roles {
  Beoordelaar = 'Beoordelaar',
  BoekhouderErkenningen = 'BoekhouderErkenningen',
  Examinator = 'Examinator',
  Hoogleraar = 'Hoogleraar',
  Inspecteur = 'Inspecteur',
  Rector = 'Rector',
  Student = 'Student',
}

export const UserContext = React.createContext<IMy | undefined>(undefined);

export const useAuth = (): {
  loading: boolean;
  error: boolean;
  authenticated: boolean;
  data?: IMy;
} => {
  const { loading, error, data } = useQuery<IMy>(GET_MY_PERSON_QUERY);

  let authenticated = false;
  let hasError = false;

  if (error) {
    // Check if it's an authentication error
    if (error.graphQLErrors) {
      for (const err of error.graphQLErrors) {
        if (!err.extensions || err.extensions.code !== 'UNAUTHENTICATED') {
          hasError = true;
        }
      }
    }
  } else if (data && data.my && data.my.Persoon) {
    authenticated = true;
  }

  return { loading, error: hasError, authenticated, data };
};

export const hasRole = (role: Roles, currentRoles?: string[]): boolean =>
  currentRoles ? currentRoles.includes(role) : false;

export const hasOneOfRoles = (roles: Roles[], currentRoles?: string[]): boolean =>
  currentRoles ? roles.some((role: Roles) => currentRoles.includes(role)) : false;

export const hasAllRoles = (roles: Roles[], currentRoles?: string[]): boolean =>
  currentRoles ? roles.every((role: Roles) => currentRoles.includes(role)) : false;
