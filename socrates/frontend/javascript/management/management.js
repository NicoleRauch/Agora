import React from 'react';
import Addresses from './addresses.js';

export default () => (
  <div>
    Management for the win!
    <Addresses displayed='Teilnehmer' data={[{
    firstname: 'A1', lastname: 'AA', email: 'a@a', homeAddressLines: 'AH', billingAddressLines: 'AB', resourceNames: 'AR'
    },
    {
    firstname: 'A2', lastname: 'AA', email: 'a@a', homeAddressLines: 'AH', billingAddressLines: 'AB', resourceNames: 'AR'
    },
    {
    firstname: 'A3', lastname: 'AA', email: 'a@a', homeAddressLines: 'AH', billingAddressLines: 'AB', resourceNames: 'AR'
    }]} />
    <hr />
    <Addresses displayed='Wartenden' data={[{
    firstname: 'B', lastname: 'BB', email: 'b@b', homeAddressLines: 'BH', billingAddressLines: 'BaB', resourceNames: 'BR'
    }]} />
  </div>
);
