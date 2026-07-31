import { createServer } from 'node:http';
import { URL } from 'node:url';

import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AbmSessionManager } from '../src/modules/abm/abm.session-manager';
import { resetAbmSessionManager } from '../src/modules/abm';
import { __setPositionLabelPdfRendererForTests } from '../src/modules/abm/positions/abm-position-label-pdf.service';
import { ABM_POSITION_FIELD_ORDER } from '../src/modules/abm/positions/abm-position.mapper';
import { clearDatabase, connectTestDatabase, createAdminSession, disconnectTestDatabase, getApp } from './helpers';

const loginPageHtml = `
  <html>
    <body>
      <form>
        <input name="__RequestVerificationToken" value="csrf-token-value" />
        <input name="UserName" value="" />
      </form>
    </body>
  </html>
`;

const createDashboardPayload = () =>
  JSON.stringify([
    { TYPE: 'POSITION', EVENTID: -1, EVENTLIBELLE: 'Total Position', COUNT: 12, COLOR: null, ICON: null, HAS_DATE: 1 },
    { TYPE: 'RETOUR', EVENTID: -2, EVENTLIBELLE: 'Total Retour', COUNT: 3, COLOR: null, ICON: null, HAS_DATE: 1 },
    { TYPE: 'ECHANGE', EVENTID: -3, EVENTLIBELLE: 'Total Echange', COUNT: 1, COLOR: null, ICON: null, HAS_DATE: 0 },
    { TYPE: 'POSITION', EVENTID: 1, EVENTLIBELLE: 'Colis crees', COUNT: '7', COLOR: null, ICON: null, HAS_DATE: 1 },
    { TYPE: 'POSITION', EVENTID: 25, EVENTLIBELLE: 'Colis livres', COUNT: 5, COLOR: null, ICON: null, HAS_DATE: true },
    { TYPE: 'RETOUR', EVENTID: 29, EVENTLIBELLE: 'Retours generes', COUNT: 2, COLOR: null, ICON: null, HAS_DATE: 1 },
    { TYPE: 'ECHANGE', EVENTID: 36, EVENTLIBELLE: 'Echanges generes', COUNT: 1, COLOR: null, ICON: null, HAS_DATE: 0 },
    { TYPE: 'POSITION', EVENTID: 555, EVENTLIBELLE: 'Inconnu', COUNT: 9, COLOR: null, ICON: null, HAS_DATE: 1 },
  ]);

const currentLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const positionPageHtml = `
  <html>
    <body>
      <form>
        <input name="__RequestVerificationToken" value="position-csrf-token" />
        <select id="select_enl">
          <option value="">Choisir</option>
          <option value="pickup-1">Naya Store (EL OMRANE)</option>
          <option value="pickup-2">Depot Centre</option>
        </select>
        <select id="select_liv">
          <option value="">Choisir</option>
          <option value="delivery-1">Client VIP</option>
        </select>
        <select id="LOCN1">
          <option value="">Choisir</option>
          <option value="11">Tunis</option>
          <option value="12">Sfax</option>
        </select>
        <select name="SERVICEID">
          <option value="BLK">BLK</option>
          <option value="ONP" selected>ONP</option>
        </select>
        <select name="POS_MR_CHOIX">
          <option value="ESPECES" selected>Especes</option>
        </select>
        <select name="MODCOLISID">
          <option value="BOX" selected>Box</option>
        </select>
        <select name="TYPEMARCHANDISE">
          <option value="STD" selected>Standard</option>
        </select>
        <input name="LONGEUR" value="1" />
        <input name="HAUTEUR" value="1" />
        <input name="LARGEUR" value="1" />
        <input name="VOLUME" value="1" />
        <input name="HEURENL" value="14:00" />
      </form>
    </body>
  </html>
`;

const detailPageHtml = `
  <div class="right_col" role="main">
    <div class="x_panel">
      <div class="col-md-4 col-sm-4 col-xs-12">
        <div class="x_panel">
          <div class="x_title">
            <h2 style="color: #161300; width: 100%;">
              <div style="margin-bottom:5px">
                Position numéro <strong onclick="PrintElem()"> 414000469384 </strong>
              </div>
              <div>
                <a target="_blank" href="/cPosition/etiquette_colis/469384">Impression normale</a>
              </div>
              <div>
                <a target="_blank" href="/cPosition/etiquette_colis_zebra/469384">Impression Zebra</a>
              </div>
            </h2>
          </div>
          <div class="x_content">
            <div class="dashboard-widget-content">
              <ul class="list-unstyled timeline widget">
                <li>
                  <div class="block"><div class="block_content"><h2 class="title"><a>Livraison planifiée en cours de tournée</a></h2><div class="byline"><span>29/07/2026 09:48:00</span></div></div></div>
                </li>
                <li>
                  <div class="block"><div class="block_content"><h2 class="title"><a>Planification Livraison</a></h2><div class="byline"><span>29/07/2026 09:47:58</span></div></div></div>
                </li>
                <li>
                  <div class="block"><div class="block_content"><h2 class="title"><a>Colis validé</a></h2><div class="byline"><span>28/07/2026 23:11:49</span></div></div></div>
                </li>
                <li>
                  <div class="block"><div class="block_content"><h2 class="title"><a>Réception HUB</a></h2><div class="byline"><span>28/07/2026 23:11:48</span></div></div></div>
                </li>
                <li>
                  <div class="block"><div class="block_content"><h2 class="title"><a>Colis enlevé</a></h2><div class="byline"><span>28/07/2026 23:06:18</span></div></div></div>
                </li>
                <li>
                  <div class="block"><div class="block_content"><h2 class="title"><a>Tentative enlevement</a></h2><div class="byline"><span>28/07/2026 23:06:17</span></div></div></div>
                </li>
                <li>
                  <div class="block"><div class="block_content"><h2 class="title"><a>Création étiquette position</a></h2><div class="byline"><span>27/07/2026 15:38:29</span></div></div></div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-8 col-sm-8 col-xs-12">
        <ul class="list-unstyled timeline" style="padding: 0px 10% 0 11%;">
          <li>
            <div class="block" style="padding-top: 20px;">
              <div class="tags"><a href="" class="tag"><span>Départ</span></a></div>
              <div class="block_content">
                <center>
                  <h2 class="title"><a style="color:#333333">Omrane  , EL OMRANE </a></h2>
                  <div class="byline" style="margin-bottom: -10px;"><span>27/07/2026 15:38:29</span></div>
                </center>
              </div>
            </div>
          </li>
          <li>
            <div class="block" style="padding-top: 20px;">
              <div class="tags"><a href="" class="tag"><span>Livraison</span></a></div>
              <div class="block_content">
                <center>
                  <h2 class="title"><a style="color:#333333">ben guerdane , BEN GUERDANE</a></h2>
                  <div class="byline" style="margin-bottom: -10px;"><span>&nbsp;</span></div>
                </center>
              </div>
            </div>
          </li>
          <li>
            <div class="block" style="padding-top: 20px;">
              <div class="tags"><a href="" class="tag"><span>Etat</span></a></div>
              <div class="block_content"><center><h2 class="title"><a style="color:#333333">Livraison planifiée en cours de tournée</a></h2></center></div>
            </div>
          </li>
        </ul>
        <section style="padding: 0px 10% 0px 11%;">
          <table class="table" style="width:100%">
            <thead><tr><th><strong>Type</strong></th><th><strong>Poids (kg)</strong></th><th><strong>Services</strong></th></tr></thead>
            <tbody><tr><td>ONP</td><td>2,00</td><td>COD</td></tr></tbody>
          </table>
          <table class="table" style="width:100%">
            <thead><tr><td><strong>Départ</strong></td><td><strong>Destination</strong></td><td><strong>Nombre de pièces</strong></td></tr></thead>
            <tbody><tr><td>Omrane  - EL OMRANE</td><td>ben guerdane - BEN GUERDANE</td><td>1</td></tr></tbody>
          </table>
          <table class="table" style="width:100%">
            <thead><tr><td><strong>Longueur (cm)</strong></td><td><strong>Largeur (cm)</strong></td><td><strong>Hauteur (cm)</strong></td></tr></thead>
            <tbody><tr><td>1,00</td><td>1,00</td><td>1,00</td></tr></tbody>
          </table>
        </section>
      </div>
    </div>
  </div>
`;

const labelPageHtml = `
  <style type="text/css">
    #printit {
      size: 7in 9.25in;
      margin: 15mm 10mm 15mm 10mm;
      page-break-after: always;
    }
  </style>
  <script>
    $(document).ready(function () {
      var mywindow = window.open('', 'PRINT', '');
      mywindow.document.write('<html>');
      mywindow.document.write('<body>');
      mywindow.document.write(document.getElementById('printit').innerHTML);
      mywindow.document.write('</html>');
      mywindow.document.close();
      mywindow.focus();
      mywindow.print();
      mywindow.close();
      window.close();
      return true;
    });
  </script>
  <script src="/template2/JsBarcode.all.js"></script>
  <div id="printit" class="printit">
    <table border="1" style="border:solid; border-radius:5px; width:50%; max-width:50%; font-size:14px">
      <tr>
        <td colspan="3">ABM Delivery</td>
        <td colspan="3">
          <svg id="barcode_467642"></svg>
          <script>
            JsBarcode("#barcode_467642", '419000467642', { displayValue: true });
          </script>
        </td>
      </tr>
      <tr>
        <td colspan="3">Expediteur</td>
        <td colspan="3">Destinataire</td>
      </tr>
      <tr>
        <td colspan="6">COD</td>
      </tr>
      <tr>
        <td colspan="3">
          <input type="checkbox" checked disabled />
          Livrer contre un montant de <strong>88,000</strong> Dinars
        </td>
        <td colspan="3">
          <svg id="barcodest_467642"></svg>
          <script>
            JsBarcode("#barcodest_467642", '26072601156012', { displayValue: false });
          </script>
        </td>
      </tr>
      <tr>
        <td colspan="6"><strong>Accuse de prise en charge du colis</strong></td>
      </tr>
    </table>
  </div>
`;

const pickupAddressDetailPayload = JSON.stringify({
  CONTACTNOM: 'Store',
  CONTACTPRENOM: 'Naya',
  ADR1: '12 Rue du Lac',
  ADR2: 'Bloc B',
  LOCN1: '11',
  LOCN2: '1101',
  LOCN3: '110101',
  LIBELLEN1: 'Tunis',
  LIBELLEN2: 'Bab Bhar',
  LIBELLEN3: 'Centre Ville',
  CODEPOSTAL: '1000',
  ADRPORTABLE: '20123456',
  ADRTEL: '71222333',
  ADRFAX: '71222334',
  ADRMAIL: 'pickup@example.com',
});

const deliveryAddressDetailPayload = JSON.stringify({
  CONTACTNOM: 'Client',
  CONTACTPRENOM: 'Ali',
  ADR1: 'Avenue Habib Bourguiba',
  ADR2: '',
  LOCN1: '11',
  LOCN2: '1102',
  LOCN3: '110202',
  LIBELLEN1: 'Tunis',
  LIBELLEN2: 'Carthage',
  LIBELLEN3: 'Sidi Bou Said',
  CODEPOSTAL: '2026',
  ADRPORTABLE: '55111222',
  ADRTEL: '71222444',
});

const createPositionPayload = () => ({
  pickup: {
    addressBookId: 'pickup-1',
    contactLastName: 'Store',
    contactFirstName: 'Naya',
    addressLine1: '12 Rue du Lac',
    addressLine2: 'Bloc B',
    governorateId: '11',
    cityId: '1101',
    localityId: '110101',
    postalCode: '1000',
    mobile: '20123456',
    phone: '71222333',
    fax: '71222334',
    email: 'pickup@example.com',
  },
  delivery: {
    addressBookId: 'delivery-1',
    contactLastName: 'Client',
    contactFirstName: 'Ali',
    addressLine1: 'Avenue Habib Bourguiba',
    governorateId: '11',
    cityId: '1102',
    localityId: '110202',
    postalCode: '2026',
    mobile: '55111222',
    phone: '71222444',
  },
  parcel: {
    pickupDate: '2026-07-28',
    pickupTime: '14:00',
    weight: 2.5,
    pieces: 1,
    reference: 'CMD-1001',
    declaredValue: 120,
    contents: ['robe', 'ceinture'],
  },
  service: {
    serviceId: 'ONP',
    codAmount: 120,
    paymentModeId: 'ESPECES',
    exchange: false,
    allowOpen: false,
  },
});

const createPositionsListPayload = () =>
  JSON.stringify([
    {
      POSID: 'P-100',
      POSBARCODE: 'BAR-100',
      POSREFERENCE: 'CMD-100',
      DATECREATE: '/Date(1785339000000)/',
      POSDATEENL: '/Date(1785342600000)/',
      POSDATELIV: '',
      DATEUPD: '/Date(1785346200000)/',
      ENL_LIBELLEN1: 'Tunis',
      ENL_LIBELLEN2: 'Bab Bhar',
      ENL_LIBELLEN3: 'Centre Ville',
      LIV_LIBELLEN1: 'Ariana',
      LIV_LIBELLEN2: 'Raoued',
      LIV_LIBELLEN3: 'Borj Touil',
      LIV_CODEP: '2083',
      LIV_ADR1: 'Rue 1',
      LIV_ADR2: '',
      LIV_ADPCONTACTNOM: 'Beji',
      LIV_ADPCONTACTPRENOM: 'Sara',
      LIV_ADPPORTABLE: '55111222',
      LIV_EMAIL: 'sara@example.com',
      SERVICEINTITULE: 'ONP',
      COLMNTCOD: '100.500',
      EVENTID: 1,
      STATLIBELLE: 'Creation etiquette',
      POSTENTATIVELIV: '0',
      POSNBPIECE: '2',
    },
    {
      POSID: 'P-200',
      POSBARCODE: 'BAR-200',
      POSREFERENCE: 'CMD-200',
      DATECREATE: '2026-07-28T10:00:00.000Z',
      POSDATEENL: '2026-07-28T12:00:00.000Z',
      POSDATELIV: '2026-07-29T14:00:00.000Z',
      DATEUPD: '2026-07-29T14:30:00.000Z',
      ENL_LIBELLEN1: 'Tunis',
      ENL_LIBELLEN2: 'Le Bardo',
      ENL_LIBELLEN3: 'Beb Saadoun',
      LIV_LIBELLEN1: 'Sousse',
      LIV_LIBELLEN2: 'Hammam Sousse',
      LIV_LIBELLEN3: 'Khzema',
      LIV_CODEP: '4051',
      LIV_ADR1: 'Rue 2',
      LIV_ADR2: 'Immeuble A',
      LIV_ADPCONTACTNOM: 'Mekni',
      LIV_ADPCONTACTPRENOM: 'Ali',
      LIV_ADPPORTABLE: '55879759',
      LIV_EMAIL: 'ali@example.com',
      SERVICEINTITULE: 'BLK',
      COLMNTCOD: '55',
      EVENTID: 20,
      STATLIBELLE: 'Anomalie livraison',
      POSTENTATIVELIV: '2',
      POSNBPIECE: '1',
    },
    {
      POSID: 'P-300',
      POSBARCODE: 'BAR-300',
      POSREFERENCE: 'CMD-300',
      DATECREATE: '/Date(1785252600000)/',
      POSDATEENL: '',
      POSDATELIV: '',
      DATEUPD: '',
      ENL_LIBELLEN1: 'Tunis',
      ENL_LIBELLEN2: 'Lac 1',
      ENL_LIBELLEN3: 'Les Berges',
      LIV_LIBELLEN1: 'Nabeul',
      LIV_LIBELLEN2: 'Nabeul',
      LIV_LIBELLEN3: 'Centre',
      LIV_CODEP: '8000',
      LIV_ADR1: 'Rue 3',
      LIV_ADR2: '',
      LIV_ADPCONTACTNOM: 'Client',
      LIV_ADPCONTACTPRENOM: 'Retour',
      LIV_ADPPORTABLE: '22111111',
      LIV_EMAIL: '',
      SERVICEINTITULE: 'FIX',
      COLMNTCOD: '0',
      EVENTID: 25,
      STATLIBELLE: 'Livre',
      POSTENTATIVELIV: '1',
      POSNBPIECE: '4',
    },
  ]);

describe('ABM dashboard integration', () => {
  let server: ReturnType<typeof createServer> | null = null;
  let loginResponseText = 'success_client';
  let includeLoginToken = true;
  let issueAuthCookie = true;
  let expireFirstDashboardRequest = false;
  let loginRequestCount = 0;
  let dashboardRequestCount = 0;
  let positionPageRequestCount = 0;
  let lastLoginBody = '';
  let lastDashboardQuery = '';
  let lastGetLocn2Body = '';
  let lastGetLocn3Body = '';
  let lastGetCpBody = '';
  let lastPickupDetailBody = '';
  let lastDeliveryDetailBody = '';
  let lastCreatePositionBody = '';
  let lastCreatePositionHeaders: Record<string, string | string[] | undefined> = {};
  let createPositionResponseText = 'success__POS-1001';
  let positionsListRequestCount = 0;
  let expireFirstPositionsListRequest = false;
  let lastPositionsListQuery = '';
  let deletePositionResponseText = '"success"';
  let lastDeletePositionPath = '';
  let detailRequestCount = 0;
  let expireFirstDetailRequest = false;
  let lastDetailPositionPath = '';
  let lastLabelPath = '';
  let labelRequestCount = 0;
  let expireFirstLabelRequest = false;
  let normalLabelContentType = 'text/html; charset=utf-8';
  let zebraLabelContentType = 'text/html; charset=utf-8';
  let normalLabelBody = labelPageHtml;
  let zebraLabelBody = labelPageHtml.replace('width:50%; max-width:50%;', 'width:100%; max-width:100%;');

  const startServer = async () => {
    server = createServer(async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1:4105');
      const readBody = async () =>
        new Promise<string>((resolve) => {
          let value = '';
          req.on('data', (chunk) => {
            value += chunk.toString();
          });
          req.on('end', () => resolve(value));
        });

      if (req.method === 'GET' && url.pathname === '/Authentification/Login') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(
          includeLoginToken
            ? loginPageHtml
            : '<html><body><form><input name="UserName" value="" /></form></body></html>',
        );
        return;
      }

      if (req.method === 'POST' && url.pathname === '/Authentification/Login') {
        loginRequestCount += 1;
        const body = await readBody();
        lastLoginBody = body;

        const headers: Record<string, string | string[]> = {
          'Content-Type': 'text/plain; charset=utf-8',
        };

        if (issueAuthCookie && loginResponseText.startsWith('success')) {
          headers['Set-Cookie'] = ['.AspNet.ApplicationCookie=abm-session; Path=/; HttpOnly'];
        }

        if (issueAuthCookie && loginResponseText === 'account_spe') {
          headers['Set-Cookie'] = ['.AspNet.ApplicationCookie=abm-session; Path=/; HttpOnly'];
        }

        res.writeHead(200, headers);
        res.end(loginResponseText);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/cHome/GetDashboardStats') {
        dashboardRequestCount += 1;
        lastDashboardQuery = url.search;

        if (expireFirstDashboardRequest) {
          expireFirstDashboardRequest = false;
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(loginPageHtml);
          return;
        }

        if (!String(req.headers.cookie ?? '').includes('.AspNet.ApplicationCookie=abm-session')) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(loginPageHtml);
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(createDashboardPayload());
        return;
      }

      if (req.method === 'GET' && url.pathname === '/cPosition/position_add') {
        positionPageRequestCount += 1;

        if (!String(req.headers.cookie ?? '').includes('.AspNet.ApplicationCookie=abm-session')) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(loginPageHtml);
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Set-Cookie': ['__RequestVerificationToken_abm=form-cookie; Path=/; HttpOnly'],
        });
        res.end(positionPageHtml);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/Content/print.css') {
        res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
        res.end('@page { size: auto A4 landscape; margin: 3mm; }');
        return;
      }

      if (req.method === 'GET' && url.pathname === '/template2/JsBarcode.all.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
        res.end('window.JsBarcode = window.JsBarcode || function() {};');
        return;
      }

      if (req.method === 'POST' && url.pathname === '/cPosition/getlocn1') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify([{ IDN1: '11', LIBELLEN1: 'Tunis' }]));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/cPosition/getlocn2') {
        lastGetLocn2Body = await readBody();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify([{ IDN2: '1102', LIBELLEN2: 'Carthage' }]));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/cPosition/getlocn3') {
        lastGetLocn3Body = await readBody();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify([{ IDN3: '110202', LIBELLEN3: 'Sidi Bou Said' }]));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/cPosition/getCP') {
        lastGetCpBody = await readBody();
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('2026');
        return;
      }

      if (req.method === 'POST' && url.pathname === '/cPosition/get_details_adrENL') {
        lastPickupDetailBody = await readBody();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(pickupAddressDetailPayload);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/cPosition/get_details_adrliv') {
        lastDeliveryDetailBody = await readBody();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(deliveryAddressDetailPayload);
        return;
      }

      if (req.method === 'POST' && url.pathname === '/cPosition/validate_add') {
        lastCreatePositionBody = await readBody();
        lastCreatePositionHeaders = req.headers;
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(createPositionResponseText);
        return;
      }

      if (req.method === 'GET' && url.pathname === '/cPosition') {
        positionsListRequestCount += 1;
        lastPositionsListQuery = url.search;

        if (expireFirstPositionsListRequest) {
          expireFirstPositionsListRequest = false;
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(loginPageHtml);
          return;
        }

        if (!String(req.headers.cookie ?? '').includes('.AspNet.ApplicationCookie=abm-session')) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(loginPageHtml);
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(createPositionsListPayload());
        return;
      }

      if (req.method === 'GET' && url.pathname.startsWith('/cPosition/position_Delete/')) {
        lastDeletePositionPath = url.pathname;
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(deletePositionResponseText);
        return;
      }

      if (req.method === 'GET' && url.pathname.startsWith('/cPosition/position_details/')) {
        detailRequestCount += 1;
        lastDetailPositionPath = url.pathname;

        if (expireFirstDetailRequest) {
          expireFirstDetailRequest = false;
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(loginPageHtml);
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(detailPageHtml);
        return;
      }

      if (
        req.method === 'GET' &&
        (url.pathname.startsWith('/cPosition/etiquette_colis/') ||
          url.pathname.startsWith('/cPosition/etiquette_colis_zebra/'))
      ) {
        labelRequestCount += 1;
        lastLabelPath = url.pathname;

        if (expireFirstLabelRequest) {
          expireFirstLabelRequest = false;
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(loginPageHtml);
          return;
        }

        const isZebra = url.pathname.startsWith('/cPosition/etiquette_colis_zebra/');
        const body = isZebra ? zebraLabelBody : normalLabelBody;
        const contentType = isZebra ? zebraLabelContentType : normalLabelContentType;

        res.writeHead(200, {
          'Content-Type': contentType,
          'Set-Cookie': ['abm-print-cookie=secret; Path=/; HttpOnly'],
        });
        res.end(body);
        return;
      }

      res.writeHead(404).end();
    });

    await new Promise<void>((resolve) => server?.listen(4105, '127.0.0.1', () => resolve()));
  };

  beforeAll(async () => {
    await connectTestDatabase();
    await startServer();
  }, 300_000);

  afterAll(async () => {
    await disconnectTestDatabase();
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }, 30_000);

  beforeEach(async () => {
    await clearDatabase();
    resetAbmSessionManager();
    loginResponseText = 'success_client';
    includeLoginToken = true;
    issueAuthCookie = true;
    expireFirstDashboardRequest = false;
    loginRequestCount = 0;
    dashboardRequestCount = 0;
    positionPageRequestCount = 0;
    lastLoginBody = '';
    lastDashboardQuery = '';
    lastGetLocn2Body = '';
    lastGetLocn3Body = '';
    lastGetCpBody = '';
    lastPickupDetailBody = '';
    lastDeliveryDetailBody = '';
    lastCreatePositionBody = '';
    lastCreatePositionHeaders = {};
    createPositionResponseText = 'success__POS-1001';
    positionsListRequestCount = 0;
    expireFirstPositionsListRequest = false;
    lastPositionsListQuery = '';
    deletePositionResponseText = '"success"';
    lastDeletePositionPath = '';
    detailRequestCount = 0;
    expireFirstDetailRequest = false;
    lastDetailPositionPath = '';
    lastLabelPath = '';
    labelRequestCount = 0;
    expireFirstLabelRequest = false;
    normalLabelContentType = 'text/html; charset=utf-8';
    zebraLabelContentType = 'text/html; charset=utf-8';
    normalLabelBody = labelPageHtml;
    zebraLabelBody = labelPageHtml.replace('width:50%; max-width:50%;', 'width:100%; max-width:100%;');
    __setPositionLabelPdfRendererForTests(null);
  });

  it('extracts the login csrf token, sends the exact form fields, and reuses a valid session', async () => {
    const manager = new AbmSessionManager({
      baseUrl: 'http://127.0.0.1:4105',
      username: 'abm-test-user',
      password: 'abm-test-password',
      timeoutMs: 15_000,
    });

    const first = await manager.getDashboardPayload({ debut: null, fin: null });
    const second = await manager.getDashboardPayload({ debut: null, fin: null });

    expect(JSON.parse(first)).toHaveLength(8);
    expect(JSON.parse(second)).toHaveLength(8);
    expect(loginRequestCount).toBe(1);

    const params = new URLSearchParams(lastLoginBody);
    expect(params.get('__RequestVerificationToken')).toBe('csrf-token-value');
    expect(params.get('UserName')).toBe('abm-test-user');
    expect(params.get('password')).toBe('abm-test-password');
  });

  it('serializes concurrent login attempts behind one in-flight promise', async () => {
    const manager = new AbmSessionManager({
      baseUrl: 'http://127.0.0.1:4105',
      username: 'abm-test-user',
      password: 'abm-test-password',
      timeoutMs: 15_000,
    });

    await Promise.all([
      manager.getDashboardPayload({ debut: null, fin: null }),
      manager.getDashboardPayload({ debut: null, fin: null }),
      manager.getDashboardPayload({ debut: null, fin: null }),
    ]);

    expect(loginRequestCount).toBe(1);
    expect(dashboardRequestCount).toBe(3);
  });

  it('fails when the login csrf token is missing and maps ABM login failure cases', async () => {
    const manager = new AbmSessionManager({
      baseUrl: 'http://127.0.0.1:4105',
      username: 'abm-test-user',
      password: 'abm-test-password',
      timeoutMs: 15_000,
    });

    includeLoginToken = false;
    await expect(manager.getDashboardPayload({ debut: null, fin: null })).rejects.toMatchObject({
      details: { code: 'ABM_BAD_RESPONSE' },
    });

    includeLoginToken = true;
    loginResponseText = 'bloque';
    resetAbmSessionManager();
    await expect(manager.getDashboardPayload({ debut: null, fin: null })).rejects.toMatchObject({
      details: { code: 'ABM_ACCOUNT_BLOCKED' },
    });

    loginResponseText = 'type_usr';
    resetAbmSessionManager();
    await expect(manager.getDashboardPayload({ debut: null, fin: null })).rejects.toMatchObject({
      details: { code: 'ABM_ACCOUNT_TYPE_UNSUPPORTED' },
    });

    loginResponseText = 'invalid_credentials';
    resetAbmSessionManager();
    await expect(manager.getDashboardPayload({ debut: null, fin: null })).rejects.toMatchObject({
      details: { code: 'ABM_LOGIN_FAILED' },
    });
  });

  it('re-authenticates once when the protected endpoint returns a login page', async () => {
    const manager = new AbmSessionManager({
      baseUrl: 'http://127.0.0.1:4105',
      username: 'abm-test-user',
      password: 'abm-test-password',
      timeoutMs: 15_000,
    });

    expireFirstDashboardRequest = true;
    const payload = await manager.getDashboardPayload({ debut: '2026-07-01', fin: '2026-07-28' });

    expect(JSON.parse(payload)).toHaveLength(8);
    expect(loginRequestCount).toBe(2);
    expect(lastDashboardQuery).toContain('debut=2026-07-01');
    expect(lastDashboardQuery).toContain('fin=2026-07-28');
  });

  it('protects the admin dashboard endpoint with RBAC, validates dates, and normalizes the response', async () => {
    const customerAgent = request.agent(getApp());
    await customerAgent.post('/api/auth/register').send({
      firstName: 'Customer',
      lastName: 'User',
      email: 'customer@example.com',
      password: 'Password123',
    });
    await customerAgent.post('/api/auth/login').send({
      email: 'customer@example.com',
      password: 'Password123',
    });

    const forbidden = await customerAgent.get('/api/admin/abm/dashboard');
    expect(forbidden.status).toBe(403);

    const { agent: adminAgent } = await createAdminSession();

    const invalid = await adminAgent.get('/api/admin/abm/dashboard?from=2026-07-28');
    expect(invalid.status).toBe(400);

    const filtered = await adminAgent.get('/api/admin/abm/dashboard?from=2026-07-01&to=2026-07-28');
    expect(filtered.status).toBe(200);
    expect(filtered.body.dashboard.totals).toEqual({
      positions: 12,
      returns: 3,
      exchanges: 1,
    });
    expect(filtered.body.dashboard.period).toEqual({
      from: '2026-07-01',
      to: '2026-07-28',
      filtered: true,
    });
    expect(filtered.body.dashboard.groups.POSITION).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventId: 1, label: 'Colis crees', count: 7, hasDate: true }),
        expect.objectContaining({ eventId: 555, label: 'Inconnu', count: 9, hasDate: true }),
      ]),
    );

    const unfiltered = await adminAgent.get('/api/admin/abm/dashboard');
    expect(unfiltered.status).toBe(200);
    expect(unfiltered.body.dashboard.period).toEqual({
      from: null,
      to: null,
      filtered: false,
    });
  });

  it('loads ABM position form options and keeps the csrf token backend-only', async () => {
    const { agent: adminAgent } = await createAdminSession();

    const response = await adminAgent.get('/api/admin/abm/positions/form-options');

    expect(response.status).toBe(200);
    expect(response.body.options.preferredPickupAddressId).toBe('pickup-1');
    expect(response.body.options.pickupAddressBook).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'pickup-1', label: 'Naya Store (EL OMRANE)' }),
      ]),
    );
    expect(response.body.options.deliveryAddressBook).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'delivery-1', label: 'Client VIP' }),
      ]),
    );
    expect(response.body.options.defaults).toEqual({
      packagingId: 'BOX',
      merchandiseTypeId: 'STD',
      length: '1',
      height: '1',
      width: '1',
      volume: '1',
      pickupTime: '14:00',
    });
    expect(response.body.options.csrfToken).toBeUndefined();
  });

  it('protects ABM position helper endpoints with RBAC and maps cascading location data', async () => {
    const customerAgent = request.agent(getApp());
    await customerAgent.post('/api/auth/register').send({
      firstName: 'Customer',
      lastName: 'User',
      email: 'customer-positions@example.com',
      password: 'Password123',
    });
    await customerAgent.post('/api/auth/login').send({
      email: 'customer-positions@example.com',
      password: 'Password123',
    });

    const forbidden = await customerAgent.get('/api/admin/abm/locations/governorates');
    expect(forbidden.status).toBe(403);

    const { agent: adminAgent } = await createAdminSession();

    const governorates = await adminAgent.get('/api/admin/abm/locations/governorates');
    expect(governorates.status).toBe(200);
    expect(governorates.body.governorates).toEqual([{ id: '11', label: 'Tunis' }]);

    const cities = await adminAgent.get('/api/admin/abm/locations/cities?governorateId=11');
    expect(cities.status).toBe(200);
    expect(cities.body.cities).toEqual([{ id: '1102', label: 'Carthage' }]);
    expect(new URLSearchParams(lastGetLocn2Body).get('idn1')).toBe('11');

    const localities = await adminAgent.get('/api/admin/abm/locations/localities?cityId=1102');
    expect(localities.status).toBe(200);
    expect(localities.body.localities).toEqual([{ id: '110202', label: 'Sidi Bou Said' }]);
    expect(new URLSearchParams(lastGetLocn3Body).get('idn2')).toBe('1102');

    const postalCode = await adminAgent.get('/api/admin/abm/locations/postal-code?localityId=110202');
    expect(postalCode.status).toBe(200);
    expect(postalCode.body).toEqual({ postalCode: '2026' });
    expect(new URLSearchParams(lastGetCpBody).get('idn3')).toBe('110202');
  });

  it('loads and normalizes pickup and delivery address details', async () => {
    const { agent: adminAgent } = await createAdminSession();

    const pickup = await adminAgent.get('/api/admin/abm/positions/addresses/pickup/pickup-1');
    expect(pickup.status).toBe(200);
    expect(new URLSearchParams(lastPickupDetailBody).get('id')).toBe('pickup-1');
    expect(pickup.body.address).toEqual({
      id: 'pickup-1',
      contactLastName: 'Store',
      contactFirstName: 'Naya',
      addressLine1: '12 Rue du Lac',
      addressLine2: 'Bloc B',
      governorateId: '11',
      governorateName: 'Tunis',
      cityId: '1101',
      cityName: 'Bab Bhar',
      localityId: '110101',
      localityName: 'Centre Ville',
      postalCode: '1000',
      mobile: '20123456',
      phone: '71222333',
      fax: '71222334',
      email: 'pickup@example.com',
    });

    const delivery = await adminAgent.get('/api/admin/abm/positions/addresses/delivery/delivery-1');
    expect(delivery.status).toBe(200);
    expect(new URLSearchParams(lastDeliveryDetailBody).get('id')).toBe('delivery-1');
    expect(delivery.body.address).toEqual({
      id: 'delivery-1',
      contactLastName: 'Client',
      contactFirstName: 'Ali',
      addressLine1: 'Avenue Habib Bourguiba',
      governorateId: '11',
      governorateName: 'Tunis',
      cityId: '1102',
      cityName: 'Carthage',
      localityId: '110202',
      localityName: 'Sidi Bou Said',
      postalCode: '2026',
      mobile: '55111222',
      phone: '71222444',
    });
  });

  it('creates an ABM position with the normalized payload, exact order, and same antiforgery jar', async () => {
    const { agent: adminAgent } = await createAdminSession();

    const response = await adminAgent.post('/api/admin/abm/positions').send(createPositionPayload());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      position: { id: 'POS-1001' },
      message: 'Position creee avec succes.',
    });
    expect(positionPageRequestCount).toBeGreaterThan(0);

    const params = new URLSearchParams(lastCreatePositionBody);
    expect(Array.from(params.keys())).toEqual(ABM_POSITION_FIELD_ORDER);
    expect(params.size).toBe(ABM_POSITION_FIELD_ORDER.length);
    expect(params.get('__RequestVerificationToken')).toBe('position-csrf-token');
    expect(params.has('select_enl')).toBe(false);
    expect(params.has('select_liv')).toBe(false);
    expect(params.get('CONTACTNOM')).toBe('Store');
    expect(params.get('ELOCN1')).toBe('11');
    expect(params.get('LOCN1LIV')).toBe('11');
    expect(params.get('POSITION_TIME_LIV_DISPO_FROM')).toBe('10:00');
    expect(params.get('POSITION_TIME_LIV_DISPO_TO')).toBe('14:00');
    expect(params.get('MODCOLISID')).toBe('BOX');
    expect(params.get('TYPEMARCHANDISE')).toBe('STD');
    expect(params.get('LONGEUR')).toBe('1');
    expect(params.get('HAUTEUR')).toBe('1');
    expect(params.get('LARGEUR')).toBe('1');
    expect(params.get('VOLUME')).toBe('1');
    expect(params.get('DATEENL')).toBe('2026-07-28');
    expect(params.get('POIDS')).toBe('2.5');
    expect(params.get('POSNBPIECE')).toBe('1');
    expect(params.get('TAGS')).toBe('robe,ceinture');
    expect(params.get('SERVICEID')).toBe('ONP');
    expect(params.get('MONTANT')).toBe('120');
    expect(params.get('POS_MR_CHOIX')).toBe('ESPECES');
    expect(params.get('RTRN')).toBe('0');
    expect(params.get('POS_ALLOW_OPEN')).toBe('0');
    expect(params.get('ADRFAX')).toBe('71222334');
    expect(params.get('ADR2LIV')).toBe('');
    expect(params.get('CONTACTPRENOMLIV')).toBe('Ali');
    expect(params.get('RTRNCONTENU')).toBe('');

    expect(lastCreatePositionHeaders['content-type']).toBe('application/x-www-form-urlencoded; charset=UTF-8');
    expect(lastCreatePositionHeaders.accept).toBe('*/*');
    expect(lastCreatePositionHeaders['x-requested-with']).toBe('XMLHttpRequest');
    expect(lastCreatePositionHeaders.referer).toBe('http://127.0.0.1:4105/cPosition/position_add');
    expect(lastCreatePositionHeaders.origin).toBe('http://127.0.0.1:4105');
    expect(String(lastCreatePositionHeaders.cookie ?? '')).toContain('.AspNet.ApplicationCookie=abm-session');
    expect(String(lastCreatePositionHeaders.cookie ?? '')).toContain('__RequestVerificationToken_abm=form-cookie');
  });

  it('accepts ABM success markers even when wrapped in a broader response body', async () => {
    const { agent: adminAgent } = await createAdminSession();

    createPositionResponseText = '<div class="notice">ok</div> success__POS-2002 <div>done</div>';
    const response = await adminAgent.post('/api/admin/abm/positions').send(createPositionPayload());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      position: { id: 'POS-2002' },
      message: 'Position creee avec succes.',
    });
  });

  it('maps COD_INVALIDE, server failures, and unknown ABM creation failures to safe errors', async () => {
    const { agent: adminAgent } = await createAdminSession();

    createPositionResponseText = 'COD_INVALIDE';
    const invalidCod = await adminAgent.post('/api/admin/abm/positions').send(createPositionPayload());
    expect(invalidCod.status).toBe(422);
    expect(invalidCod.body.message).toBe('Le montant a collecter est invalide.');
    expect(invalidCod.body.details).toEqual({ code: 'ABM_INVALID_COD_AMOUNT' });

    createPositionResponseText = '<html><head><title>500 - Internal server error.</title></head><body>Internal Server Error</body></html>';
    const serverFailure = await adminAgent.post('/api/admin/abm/positions').send(createPositionPayload());
    expect(serverFailure.status).toBe(502);
    expect(serverFailure.body.message).toBe('ABM a rencontre une erreur interne pendant la creation.');
    expect(serverFailure.body.details).toEqual({ code: 'ABM_SERVER_ERROR' });

    createPositionResponseText = 'unexpected_html_error';
    const failed = await adminAgent.post('/api/admin/abm/positions').send(createPositionPayload());
    expect(failed.status).toBe(502);
    expect(failed.body.message).toBe('Impossible de charger les statistiques ABM pour le moment.');
    expect(failed.body.details).toEqual({ code: 'ABM_BAD_RESPONSE' });
    expect(JSON.stringify(failed.body)).not.toContain('position-csrf-token');
  });

  it('protects the ABM positions list endpoint, defaults dates to today, and normalizes/filter/sort/paginate data', async () => {
    const customerAgent = request.agent(getApp());
    await customerAgent.post('/api/auth/register').send({
      firstName: 'Customer',
      lastName: 'Positions',
      email: 'customer-list@example.com',
      password: 'Password123',
    });
    await customerAgent.post('/api/auth/login').send({
      email: 'customer-list@example.com',
      password: 'Password123',
    });

    const forbidden = await customerAgent.get('/api/admin/abm/positions');
    expect(forbidden.status).toBe(403);

    const { agent: adminAgent } = await createAdminSession();

    const defaultResponse = await adminAgent.get('/api/admin/abm/positions');
    if (defaultResponse.status !== 200) console.log(defaultResponse.body);
    expect(defaultResponse.status).toBe(200);
    const today = currentLocalDate();
    expect(lastPositionsListQuery).toContain(`datestart=${today}`);
    expect(lastPositionsListQuery).toContain(`dateend=${today}`);
    expect(defaultResponse.body.items).toHaveLength(3);
    expect(defaultResponse.body.items[0]).toMatchObject({
      id: 'P-100',
      barcode: 'BAR-100',
      reference: 'CMD-100',
      statusCategory: 'created',
      statusLabel: 'Creation etiquette',
    });
    expect(defaultResponse.body.items[0].createdAt).toBe('2026-07-29T15:30:00.000Z');
    expect(defaultResponse.body.summary).toEqual({
      total: 3,
      totalCod: 155.5,
      delivered: 1,
      anomalies: 1,
    });
    expect(defaultResponse.body.period).toEqual({
      from: today,
      to: today,
    });
  });

  it('re-authenticates once when the ABM positions list responds with a login page', async () => {
    const { agent: adminAgent } = await createAdminSession();

    expireFirstPositionsListRequest = true;
    const response = await adminAgent.get('/api/admin/abm/positions?from=2026-07-01&to=2026-07-28');

    expect(response.status).toBe(200);
    expect(loginRequestCount).toBe(2);
    expect(positionsListRequestCount).toBe(2);
    expect(lastPositionsListQuery).toContain('datestart=2026-07-01');
    expect(lastPositionsListQuery).toContain('dateend=2026-07-28');
  });

  describe('query contract validation (Express 5 safe)', () => {
    it('accepts minimal query with just from and to', async () => {
      const { agent: adminAgent } = await createAdminSession();
      const res = await adminAgent.get('/api/admin/abm/positions?from=2026-07-01&to=2026-07-28');
      expect(res.status).toBe(200);
      expect(res.body.period.from).toBe('2026-07-01');
      expect(res.body.period.to).toBe('2026-07-28');
    });

    it('rejects missing from', async () => {
      const { agent: adminAgent } = await createAdminSession();
      const res = await adminAgent.get('/api/admin/abm/positions?to=2026-07-28');
      expect(res.status).toBe(400);
    });

    it('rejects missing to', async () => {
      const { agent: adminAgent } = await createAdminSession();
      const res = await adminAgent.get('/api/admin/abm/positions?from=2026-07-01');
      expect(res.status).toBe(400);
    });

    it('rejects from greater than to', async () => {
      const { agent: adminAgent } = await createAdminSession();
      const res = await adminAgent.get('/api/admin/abm/positions?from=2026-07-28&to=2026-07-01');
      expect(res.status).toBe(400);
    });
  });

  it('maps ABM position delete responses safely', async () => {
    const { agent: adminAgent } = await createAdminSession();

    const success = await adminAgent.delete('/api/admin/abm/positions/P-100');
    expect(success.status).toBe(200);
    expect(success.body).toEqual({
      result: { deleted: true },
      message: 'Position supprimee avec succes.',
    });
    expect(lastDeletePositionPath).toBe('/cPosition/position_Delete/P-100');

    deletePositionResponseText = 'success';
    const plainSuccess = await adminAgent.delete('/api/admin/abm/positions/P-101');
    expect(plainSuccess.status).toBe(200);
    expect(plainSuccess.body.result).toEqual({ deleted: true });

    deletePositionResponseText = 'INVALID';
    const invalid = await adminAgent.delete('/api/admin/abm/positions/P-200');
    expect(invalid.status).toBe(409);
    expect(invalid.body.message).toBe('Cette position ne peut plus etre supprimee.');
    expect(invalid.body.details).toEqual({ code: 'ABM_POSITION_DELETE_NOT_ALLOWED' });

    deletePositionResponseText = 'erreur';
    const failed = await adminAgent.delete('/api/admin/abm/positions/P-300');
    expect(failed.status).toBe(502);
    expect(failed.body.message).toBe('Impossible de supprimer la position.');
    expect(failed.body.details).toEqual({ code: 'ABM_POSITION_DELETE_FAILED' });

    deletePositionResponseText = '<html><head><title>500 - Internal server error.</title></head><body>Internal Server Error</body></html>';
    const serverFailure = await adminAgent.delete('/api/admin/abm/positions/P-350');
    expect(serverFailure.status).toBe(502);
    expect(serverFailure.body.details).toEqual({ code: 'ABM_POSITION_DELETE_FAILED' });

    deletePositionResponseText = 'unexpected';
    const unknown = await adminAgent.delete('/api/admin/abm/positions/P-400');
    expect(unknown.status).toBe(502);
    expect(unknown.body.details).toEqual({ code: 'ABM_BAD_RESPONSE' });
  });

  it('protects, validates, retries, and normalizes the ABM position detail page', async () => {
    const customerAgent = request.agent(getApp());
    await customerAgent.post('/api/auth/register').send({
      firstName: 'Customer',
      lastName: 'Viewer',
      email: 'customer-detail@example.com',
      password: 'Password123',
    });
    await customerAgent.post('/api/auth/login').send({
      email: 'customer-detail@example.com',
      password: 'Password123',
    });

    const forbidden = await customerAgent.get('/api/admin/abm/positions/469384');
    expect(forbidden.status).toBe(403);

    const { agent: adminAgent } = await createAdminSession();

    const invalid = await adminAgent.get('/api/admin/abm/positions/not-valid');
    expect(invalid.status).toBe(400);
    expect(invalid.body.message).toBe('Validation failed');

    expireFirstDetailRequest = true;
    const response = await adminAgent.get('/api/admin/abm/positions/469384');
    expect(response.status).toBe(200);
    expect(detailRequestCount).toBe(2);
    expect(lastDetailPositionPath).toBe('/cPosition/position_details/469384');
    expect(response.body.position).toMatchObject({
      id: '469384',
      barcode: '414000469384',
      status: {
        label: 'Livraison planifiée en cours de tournée',
        category: 'progress',
      },
      progressStage: 'delivery',
      departure: {
        displayLabel: 'Omrane , EL OMRANE',
      },
      destination: {
        displayLabel: 'ben guerdane , BEN GUERDANE',
      },
      shipment: {
        type: 'ONP',
        service: 'COD',
        weightKg: 2,
        pieces: 1,
      },
      dimensions: {
        lengthCm: 1,
        widthCm: 1,
        heightCm: 1,
        volume: 1,
      },
      permissions: {
        canEdit: false,
        canDelete: false,
        canPrintNormal: true,
        canPrintZebra: true,
      },
    });
    expect(response.body.position.events).toHaveLength(7);
    expect(response.body.position.events[0]).toMatchObject({
      label: 'Livraison planifiée en cours de tournée',
      isCurrent: true,
      occurredAt: '2026-07-29T08:48:00.000Z',
    });
    expect(response.body.position.events[6]).toMatchObject({
      label: 'Création étiquette position',
      occurredAt: '2026-07-27T14:38:29.000Z',
    });
    expect(JSON.stringify(response.body)).not.toContain('__RequestVerificationToken');
  });

  it('returns sanitized HTML previews with strict headers and no upstream cookies', async () => {
    const { agent: adminAgent } = await createAdminSession();

    const normal = await adminAgent.get('/api/admin/abm/positions/469384/labels/normal/preview');
    expect(normal.status).toBe(200);
    expect(lastLabelPath).toBe('/cPosition/etiquette_colis/469384');
    expect(normal.headers['content-type']).toContain('text/html; charset=utf-8');
    expect(normal.headers['content-security-policy']).toContain("default-src 'none'");
    expect(normal.headers['cache-control']).toBe('private, no-store');
    expect(normal.headers['pragma']).toBe('no-cache');
    expect(normal.headers['x-content-type-options']).toBe('nosniff');
    expect(normal.headers['content-disposition']).toContain('inline; filename="ABM-position-469384-normal.html"');
    expect(normal.headers['set-cookie']).toBeUndefined();
    expect(normal.text).toContain('window.__ABM_LABEL_READY');
    expect(normal.text).toContain('419000467642');
    expect(normal.text).toContain('88,000');
    expect(normal.text).toContain('A4 landscape');
    expect(normal.text).toContain('Times New Roman');
    expect(normal.text).toContain('#1f1f1f');
    expect(normal.text).toContain('#9f9f9f');
    expect(normal.text).not.toContain('margin: 0px -7px -4px -4px');
    expect(normal.text).not.toContain('#1d4ed8');
    expect(normal.text).not.toContain('#1e3a8a');
    expect(normal.text).not.toContain('window.open');
    expect(normal.text).not.toContain('window.print');

    const zebra = await adminAgent.get('/api/admin/abm/positions/469384/labels/zebra/preview');
    expect(zebra.status).toBe(200);
    expect(lastLabelPath).toBe('/cPosition/etiquette_colis_zebra/469384');
    expect(zebra.headers['content-type']).toContain('text/html; charset=utf-8');
    expect(zebra.headers['content-disposition']).toContain('inline; filename="ABM-position-469384-zebra.html"');
    expect(zebra.text).toContain('419000467642');
    expect(zebra.text).toContain('#222222');
    expect(zebra.text).toContain('#b8b8b8');
    expect(zebra.text).not.toContain('#1d4ed8');
  });

  it('returns generated PDFs for normal and zebra labels', async () => {
    const { agent: adminAgent } = await createAdminSession();
    __setPositionLabelPdfRendererForTests(async (html) => Buffer.from(`%PDF-FAKE\n${html.slice(0, 60)}`, 'utf-8'));

    const normal = await adminAgent.get('/api/admin/abm/positions/469384/labels/normal/pdf');
    expect(normal.status).toBe(200);
    expect(normal.headers['content-type']).toContain('application/pdf');
    expect(normal.headers['content-disposition']).toContain('attachment; filename="ABM-position-469384-normal.pdf"');
    expect(normal.headers['cache-control']).toBe('private, no-store');
    expect(Buffer.from(normal.body).subarray(0, 4).toString('utf-8')).toBe('%PDF');

    const zebra = await adminAgent.get('/api/admin/abm/positions/469384/labels/zebra/pdf?disposition=inline');
    expect(zebra.status).toBe(200);
    expect(zebra.headers['content-type']).toContain('application/pdf');
    expect(zebra.headers['content-disposition']).toContain('inline; filename="ABM-position-469384-zebra.pdf"');
    expect(Buffer.from(zebra.body).subarray(0, 4).toString('utf-8')).toBe('%PDF');
  });

  it('re-authenticates once when the preview endpoint responds with a login page', async () => {
    const { agent: adminAgent } = await createAdminSession();

    expireFirstLabelRequest = true;
    const response = await adminAgent.get('/api/admin/abm/positions/469384/labels/normal/preview');

    expect(response.status).toBe(200);
    expect(loginRequestCount).toBe(2);
    expect(labelRequestCount).toBe(2);
  });

  it('rejects unexpected print formats with a safe error', async () => {
    const { agent: adminAgent } = await createAdminSession();

    normalLabelContentType = 'application/javascript';
    normalLabelBody = 'alert(1)';

    const response = await adminAgent.get('/api/admin/abm/positions/469384/labels/normal/preview');

    expect(response.status).toBe(502);
    expect(response.body.message).toBe("Le format d'etiquette retourne par ABM n'est pas pris en charge.");
    expect(response.body.details).toEqual({ code: 'ABM_LABEL_UNSUPPORTED_FORMAT' });
  });
});
