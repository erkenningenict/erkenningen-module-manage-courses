import { gql } from 'apollo-boost';

export const SEARCH_LOCATIONS = gql`
  query SearchLocations($VakgroepID: Int!) {
    SearchLocations(input: { VakgroepID: $VakgroepID }) {
      Text: Naam
      Value: LokatieID
    }
  }
`;

export const LIST_ORGANIZERS = gql`
  query SearchOrganizers {
    SearchOrganizers {
      Text: Naam
      Value: VakgroepID
    }
  }
`;

export const LIST_SPECIALTIES = gql`
  query Specialties($vakgroepId: Int!) {
    Specialties(input: { vakgroepId: $vakgroepId }) {
      VakID
      Afkorting
      Code
      Titel
      Kosten
      MinimumDatum
      MaximumDatum
      Competenties {
        Naam
        Code
      }
      Themas {
        Naam
        Code
      }
      Promotietekst
      DigitaalAanbod
    }
  }
`;

export const GET_SPECIALTY = gql`
  query Specialty($vakId: Int!) {
    Specialty(vakId: $vakId) {
      VakID
      MinimumDatum
      MaximumDatum
    }
  }
`;
