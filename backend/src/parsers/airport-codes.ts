// Comprehensive list of IATA airport codes
// This includes major international airports worldwide

export const VALID_AIRPORT_CODES = new Set([
  // United States - Major
  'ATL', 'LAX', 'ORD', 'DFW', 'DEN', 'JFK', 'SFO', 'SEA', 'LAS', 'MCO',
  'EWR', 'MIA', 'PHX', 'IAH', 'BOS', 'MSP', 'DTW', 'FLL', 'PHL', 'LGA',
  'BWI', 'SLC', 'DCA', 'IAD', 'SAN', 'TPA', 'PDX', 'STL', 'HNL', 'BNA',
  'AUS', 'OAK', 'SMF', 'SJC', 'RDU', 'CLE', 'MCI', 'SAT', 'IND', 'PIT',
  'CMH', 'CVG', 'MKE', 'JAX', 'OMA', 'ABQ', 'ANC', 'BUF', 'OKC', 'RIC',
  'TUL', 'SDF', 'GRR', 'BOI', 'BDL', 'ONT', 'PBI', 'RSW', 'ORF', 'BHM',
  'TUS', 'ELP', 'ALB', 'ROC', 'SYR', 'PWM', 'DSM', 'LIT', 'GSO', 'RNO',
  'CHS', 'MSY', 'SNA', 'DAL', 'HOU', 'MDW', 'OGG', 'KOA', 'LIH', 'BUR',
  'PSP', 'FAT', 'ICT', 'COS', 'SAV', 'PNS', 'GEG', 'TYS', 'LEX', 'XNA',
  'GSP', 'MYR', 'DAY', 'SRQ', 'CAK', 'HSV', 'LBB', 'MAF', 'AMA', 'EUG',
  'MFR', 'RDD', 'SBA', 'SBP', 'MRY', 'PSC', 'GFK', 'FAR', 'BIS', 'RAP',
  'FSD', 'SUX', 'CID', 'MLI', 'BMI', 'PIA', 'SPI', 'EVV', 'FWA', 'SBN',

  // Canada
  'YYZ', 'YVR', 'YUL', 'YYC', 'YEG', 'YOW', 'YWG', 'YHZ', 'YQB', 'YXE',
  'YQR', 'YYJ', 'YKF', 'YXU', 'YQT', 'YQM', 'YFC', 'YYT', 'YZF', 'YXY',

  // Mexico
  'MEX', 'CUN', 'GDL', 'MTY', 'TIJ', 'SJD', 'PVR', 'MID', 'CZM', 'ACA',
  'ZIH', 'OAX', 'VER', 'AGU', 'BJX', 'CUL', 'HMO', 'MZT', 'PBC', 'QRO',
  'SLP', 'TAM', 'TRC', 'VSA', 'CME', 'CTM', 'CJS', 'LAP', 'ZCL', 'MLM',

  // Central America & Caribbean
  'PTY', 'SJO', 'LIR', 'SAL', 'GUA', 'TGU', 'SAP', 'RTB', 'MGA', 'BZE',
  'NAS', 'FPO', 'MBJ', 'KIN', 'SXM', 'AUA', 'CUR', 'BON', 'POS', 'BGI',
  'UVF', 'SLU', 'ANU', 'SKB', 'PUJ', 'SDQ', 'STI', 'HAV', 'VRA', 'SCU',
  'HOG', 'CCC', 'SNU', 'GCM', 'PTP', 'FDF', 'STT', 'STX', 'SJU', 'BQN',

  // South America
  'BOG', 'MDE', 'CLO', 'CTG', 'BAQ', 'SMR', 'ADZ', 'BGA', 'PEI', 'CUC',
  'GRU', 'GIG', 'BSB', 'CNF', 'SSA', 'REC', 'FOR', 'POA', 'CWB', 'BEL',
  'MAO', 'FLN', 'VCP', 'CGH', 'SDU', 'NAT', 'MCZ', 'AJU', 'SLZ', 'THE',
  'EZE', 'AEP', 'COR', 'MDZ', 'IGR', 'BRC', 'NQN', 'ROS', 'SLA', 'TUC',
  'SCL', 'CCP', 'PMC', 'ZCO', 'ANF', 'IQQ', 'PUQ', 'ARI', 'LSC', 'ZAL',
  'LIM', 'CUZ', 'AQP', 'PIU', 'TRU', 'JUL', 'TCQ', 'IQT', 'PEM', 'CIX',
  'UIO', 'GYE', 'CUE', 'MEC', 'GPS', 'OCC', 'XMS', 'LOH', 'LTX', 'TUA',
  'CCS', 'MAR', 'VLN', 'BLA', 'PMV', 'PZO', 'MUN', 'BRM', 'SOM', 'CUM',
  'MVD', 'PDP', 'ASU', 'CIU', 'LPB', 'VVI', 'CBB', 'SRE', 'TJA', 'ORU',
  'GEO', 'PBM', 'CAY',

  // Europe - Western
  'LHR', 'LGW', 'STN', 'LTN', 'MAN', 'EDI', 'BHX', 'GLA', 'BRS', 'NCL',
  'LPL', 'EMA', 'ABZ', 'BFS', 'SOU', 'CWL', 'EXT', 'INV', 'JER', 'GCI',
  'CDG', 'ORY', 'LYS', 'NCE', 'MRS', 'TLS', 'BOD', 'NTE', 'STR', 'LIL',
  'MPL', 'BIQ', 'RNS', 'ETZ', 'MLH', 'BVA', 'CFE', 'TLN', 'PGF', 'BES',
  'AMS', 'RTM', 'EIN', 'MST', 'GRQ', 'BRU', 'CRL', 'ANR', 'LGG', 'OST',
  'FRA', 'MUC', 'DUS', 'TXL', 'BER', 'HAM', 'CGN', 'STR', 'HAJ', 'NUE',
  'LEJ', 'DRS', 'FMO', 'DTM', 'PAD', 'BRE', 'SCN', 'FKB', 'HHN', 'NRN',
  'ZRH', 'GVA', 'BSL', 'BRN', 'LUG', 'VIE', 'SZG', 'INN', 'GRZ', 'KLU',
  'DUB', 'SNN', 'ORK', 'KNO', 'LIS', 'OPO', 'FAO', 'FNC', 'PDL', 'TER',
  'MAD', 'BCN', 'PMI', 'AGP', 'ALC', 'VLC', 'SVQ', 'BIO', 'TFS', 'LPA',
  'IBZ', 'MAH', 'ACE', 'FUE', 'SCQ', 'SDR', 'OVD', 'ZAZ', 'GRX', 'MJV',
  'FCO', 'MXP', 'LIN', 'BGY', 'VCE', 'NAP', 'BLQ', 'PSA', 'FLR', 'CTA',
  'PMO', 'BRI', 'CAG', 'TRN', 'GOA', 'TRS', 'VRN', 'OLB', 'AHO', 'SUF',

  // Europe - Nordic
  'CPH', 'BLL', 'AAL', 'AAR', 'OSL', 'BGO', 'TRD', 'SVG', 'TOS', 'BOO',
  'ARN', 'GOT', 'MMX', 'BMA', 'NYO', 'UME', 'LLA', 'VST', 'RNB', 'KRN',
  'HEL', 'TMP', 'OUL', 'TKU', 'RVN', 'KUO', 'JYV', 'VAA', 'KTT', 'IVL',
  'KEF', 'RKV', 'AEY', 'EGS', 'IFJ', 'HFN',

  // Europe - Eastern
  'WAW', 'KRK', 'GDN', 'WRO', 'POZ', 'KTW', 'LCJ', 'RZE', 'SZZ', 'BZG',
  'PRG', 'BRQ', 'OSR', 'BUD', 'DEB', 'BTS', 'KSC', 'OTP', 'CLJ', 'TSR',
  'IAS', 'SBZ', 'CRA', 'SOF', 'VAR', 'BOJ', 'PDV', 'BEG', 'NIS', 'INI',
  'ZAG', 'SPU', 'DBV', 'ZAD', 'PUY', 'RJK', 'LJU', 'MBX', 'SKP', 'OHD',
  'TIA', 'PRN', 'SJJ', 'TGD', 'TIV', 'KIV', 'RIX', 'VNO', 'KUN', 'PLQ',
  'TLL', 'TRT', 'KBP', 'IEV', 'ODS', 'LWO', 'DNK', 'HRK', 'SIP', 'MSQ',

  // Europe - Russia
  'SVO', 'DME', 'VKO', 'LED', 'AER', 'KRR', 'SVX', 'KZN', 'OVB', 'KJA',
  'IKT', 'VVO', 'KHV', 'UFA', 'ROV', 'VOG', 'GOJ', 'MMK', 'ARH', 'PKC',

  // Middle East
  'DXB', 'AUH', 'SHJ', 'DOH', 'BAH', 'KWI', 'MCT', 'SLL', 'RUH', 'JED',
  'DMM', 'MED', 'AHB', 'GIZ', 'TIF', 'TUU', 'ELQ', 'ABT', 'AJF', 'HOF',
  'AMM', 'AQJ', 'BEY', 'TLV', 'SDV', 'ETH', 'VDA', 'BGW', 'BSR', 'NJF',
  'EBL', 'ISU', 'THR', 'MHD', 'IFN', 'SYZ', 'TBZ', 'KIH', 'AWZ', 'BND',

  // Africa
  'CAI', 'HRG', 'SSH', 'LXR', 'ASW', 'ALY', 'CMN', 'RAK', 'AGA', 'FEZ',
  'TNG', 'OUD', 'NDR', 'ESU', 'RBA', 'ALG', 'ORN', 'CZL', 'AAE', 'TUN',
  'DJE', 'MIR', 'TIP', 'BEN', 'MJI', 'SEB', 'KRT', 'ADD', 'NBO', 'MBA',
  'DAR', 'ZNZ', 'JRO', 'KGL', 'BJM', 'EBB', 'FIH', 'FBM', 'LUN', 'NLA',
  'HRE', 'VFA', 'BUQ', 'LLW', 'BLZ', 'MPM', 'TNR', 'NOS', 'MRU', 'RUN',
  'SEZ', 'JNB', 'CPT', 'DUR', 'PLZ', 'ELS', 'GBE', 'WDH', 'LOS', 'ABV',
  'KAN', 'PHC', 'ABJ', 'ACC', 'LFW', 'COO', 'OUA', 'NIM', 'BKO', 'DKR',
  'DSS', 'BJP', 'CKY', 'FNA', 'ROB', 'MLW', 'BJL', 'RAI', 'SID', 'BVC',
  'SSG', 'LBV', 'POG', 'DLA', 'NSI', 'BGF', 'NDJ', 'JUB', 'MGQ', 'ASM',

  // Asia - East
  'PEK', 'PKX', 'PVG', 'SHA', 'CAN', 'CTU', 'SZX', 'HGH', 'XIY', 'NKG',
  'WUH', 'CKG', 'CSX', 'TAO', 'XMN', 'KMG', 'SYX', 'TNA', 'CGO', 'HRB',
  'DLC', 'SHE', 'TSN', 'URC', 'NNG', 'HAK', 'FOC', 'NGB', 'WNZ', 'LHW',
  'HKG', 'MFM', 'TPE', 'KHH', 'RMQ', 'TSA', 'TNN', 'TTT', 'MZG', 'KNH',
  'NRT', 'HND', 'KIX', 'CTS', 'FUK', 'NGO', 'OKA', 'ITM', 'HIJ', 'KOJ',
  'SDJ', 'NGS', 'KMI', 'AOJ', 'TAK', 'KMQ', 'FSZ', 'ASJ', 'MMJ', 'ISG',
  'ICN', 'GMP', 'PUS', 'CJU', 'TAE', 'KWJ', 'RSU', 'USN', 'MWX', 'YNY',
  'ULN', 'UBN',

  // Asia - Southeast
  'SIN', 'KUL', 'BKK', 'DMK', 'CGK', 'DPS', 'MNL', 'CEB', 'SGN', 'HAN',
  'DAD', 'PNH', 'REP', 'VTE', 'LPQ', 'RGN', 'MDL', 'BWN',
  'PEN', 'LGK', 'KCH', 'BKI', 'SBW', 'JHB', 'KBR', 'TGG', 'IPH', 'AOR',
  'SUB', 'JOG', 'SRG', 'UPG', 'BPN', 'PLM', 'PKU', 'PDG', 'BTJ', 'MDC',
  'HLP', 'KNO', 'LOP', 'DJJ', 'AMQ', 'TIM', 'BIK', 'SOQ', 'MKW', 'WMX',
  'CNX', 'HKT', 'USM', 'KBV', 'HDY', 'UTH', 'UBP', 'CEI', 'NAK', 'NST',
  'CXR', 'NHA', 'HPH', 'HUI', 'VCS', 'PQC', 'UIH', 'TBB', 'VCL', 'DIN',
  'DVO', 'ILO', 'KLO', 'ZAM', 'BXU', 'CBO', 'CGY', 'DGT', 'GES', 'MPH',
  'PPS', 'TAC', 'TAG', 'CRK', 'SFS', 'LGP', 'OZC', 'PAG', 'USU', 'WNP',

  // Asia - South
  'DEL', 'BOM', 'BLR', 'MAA', 'CCU', 'HYD', 'COK', 'AMD', 'PNQ', 'GOI',
  'JAI', 'LKO', 'TRV', 'SXR', 'ATQ', 'GAU', 'PAT', 'BBI', 'VNS', 'IXB',
  'IXC', 'RAJ', 'RPR', 'NAG', 'VTZ', 'IDR', 'TRZ', 'IMF', 'IXE', 'IXM',
  'CMB', 'HRI', 'DAC', 'CGP', 'ZYL', 'JSR', 'RJH', 'KTM', 'PKR', 'BWA',
  'ISB', 'KHI', 'LHE', 'PEW', 'MUX', 'SKT', 'UET', 'FSD', 'LYP', 'KDU',
  'MLE', 'GAN', 'HAQ', 'KDO', 'IFU', 'DRV', 'VAM', 'TMF', 'KDM', 'GKK',
  'PBH', 'KWL',

  // Asia - Central
  'TSE', 'ALA', 'AKX', 'CIT', 'URA', 'TAS', 'SKD', 'BHK', 'NMA', 'FRU',
  'OSS', 'DYU', 'LBD', 'KQT', 'ASB', 'CRZ', 'MYP', 'KRW', 'GYD', 'TBS',
  'BUS', 'KUT', 'EVN', 'LWN', 'GYD',

  // Oceania
  'SYD', 'MEL', 'BNE', 'PER', 'ADL', 'OOL', 'CNS', 'CBR', 'DRW', 'HBA',
  'NTL', 'TSV', 'AVV', 'LST', 'MCY', 'ASP', 'BME', 'PHE', 'MKY', 'ROK',
  'PPP', 'HTI', 'BDB', 'GLT', 'ARM', 'ABX', 'DPO', 'MQL', 'KGI', 'WGA',
  'AKL', 'WLG', 'CHC', 'ZQN', 'DUD', 'ROT', 'NPE', 'NPL', 'NSN', 'PMR',
  'HLZ', 'TRG', 'IVC', 'BHE', 'GIS', 'TIU', 'KKE', 'WHK', 'WRE', 'WSZ',
  'NAN', 'SUV', 'APW', 'PPT', 'BOB', 'MOZ', 'RGI', 'TKK', 'PNI', 'KSA',
  'ROR', 'NOU', 'GUM', 'SPN', 'INU', 'TBU', 'VLI', 'HIR', 'POM', 'LAE',
  'RAB', 'DRW', 'WEI', 'GOV', 'BRW', 'RAR', 'AIT', 'MGS', 'MAN', 'TRW',
]);

// Function to check if a code is a valid airport
export function isValidAirportCode(code: string): boolean {
  return VALID_AIRPORT_CODES.has(code.toUpperCase());
}

// Function to find all valid airport codes in text
export function findAirportCodes(text: string): string[] {
  const codes: string[] = [];
  // Match 3-letter uppercase codes
  const matches = text.match(/\b[A-Z]{3}\b/g) || [];

  for (const match of matches) {
    if (isValidAirportCode(match) && !codes.includes(match)) {
      codes.push(match);
    }
  }

  return codes;
}
