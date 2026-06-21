export type Stream = {
	url: string;
	quality: string | null;
	label: string | null;
};

export type Channel = {
	id: string;
	name: string;
	country: string;
	countryFlag: string;
	categories: string[];
	languages: string[];
	logo: string | null;
	streams: Stream[];
	guideIds: string[];
};

export type CatalogFilters = {
	q: string;
	country: string;
	category: string;
	language: string;
};

export type FilterOptions = {
	categories: { id: string; name: string; count: number }[];
	countries: { code: string; name: string; flag: string; count: number }[];
	languages: { code: string; name: string; count: number }[];
};

export type HomeRow = { id: string; title: string; channels: Channel[] };
export type HomeResponse = { hero: Channel | null; rows: HomeRow[] };
