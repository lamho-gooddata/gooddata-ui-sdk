// (C) 2019 GoodData Corporation
import isEmpty = require("lodash/isEmpty");
import intersection = require("lodash/intersection");
import { SortEntityIds, sortEntityIds, SortItem } from "../execution/base/sort";
import { anyBucket, BucketPredicate, IBucket } from "../execution/buckets";
import { IFilter } from "../execution/filter";
import { IMeasure, measureLocalId } from "../execution/measure";
import { attributeLocalId, IAttribute } from "../execution/attribute";
import { ITotal } from "../execution/base/totals";
import {
    bucketsAttributes,
    bucketsById,
    bucketsFind,
    bucketsMeasures,
    bucketsTotals,
} from "../execution/buckets/bucketArray";
import invariant from "ts-invariant";
import { IColor } from "../colors";

/**
 * Represents an Insight defined in GoodData platform. Insight is typically created using Analytical Designer
 * and can be embedded using UI SDK.
 *
 * Insight contains all metadata needed to construct its visualization and perform execution to obtain data
 * for that visualization.
 *
 * @public
 */
export interface IInsight {
    insight: {
        /**
         * Unique identifier of the Insight
         */
        identifier: string;

        /**
         * Link to the insight.
         */
        uri?: string;

        /**
         * User-assigned title of this insight
         */
        title: string;

        /**
         * Identifier of the visualization class that should be used to render this insight.
         */
        visualizationClassIdentifier: string;

        /**
         * Buckets of attributes, measures and totals to render on the visualization.
         */
        buckets: IBucket[];

        /**
         * Filters to apply on the data.
         */
        filters: IFilter[];

        /**
         * Sorting to apply on the data.
         */
        sorts: SortItem[];

        /**
         * Visualization-specific properties. This object MAY contain customization metadata for this insight such as:
         *
         * - what axis to display on a chart
         * - whether to display legend
         * - how to color the chart
         *
         * These properties vary from visualization to visualization. Backend does not process the properties in
         * any way.
         */
        properties: VisualizationProperties;
    };
}

/**
 * Represents an Insight without identifier. This is useful when working with Insight that do not have any identifier yet
 * (i.e. they have not been saved to the platform yet).
 *
 * @public
 */
export type IInsightWithoutIdentifier = {
    insight: Omit<IInsight["insight"], "identifier">;
};

/**
 * Visualization class is essentially a descriptor for particular type of visualization - say bar chart
 * or table. Each available visualization type is described by a class stored in the metadata. The available
 * classes influence what visualizations can users select in Analytical Designer.
 *
 * @public
 */
export interface IVisualizationClass {
    visualizationClass: {
        /**
         * Unique identifier of the visualization.
         */
        identifier: string;

        /**
         * Link to visualization class object.
         */
        uri?: string;

        /**
         * Human readable name of the visualization (Bar Chart, Pivot Table)
         */
        title: string;

        /**
         * Link to where visualization's assets reside.
         *
         * This MAY contain URLs such as 'local:bar', 'local:table' - such URLs indicate that the visualization
         * is bundled with the GoodData.UI SDK.
         */
        url: string;

        /**
         * Visualization icon to display in Analytical Designer.
         */
        icon: string;

        /**
         * Visualization icon to display when user selects the visualization in Analytical Designer.
         */
        iconSelected: string;

        /**
         * Checksum for subresource integrity checking.
         *
         * {@link https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity}
         */
        checksum: string;

        /**
         * Override ordering in the visualization catalog.
         */
        orderIndex?: number;
    };
}

/**
 * Visualization-specific properties.
 *
 * These are modelled in generic fashion as they vary visualization by visualization.
 *
 * TODO: add links to properties supported by our visualizations.
 *
 * @public
 */
export type VisualizationProperties = {
    [key: string]: any;
};

/**
 * An item in color mapping definition for an insight. The color mapping is stored in properties of those
 * insights that can be colored AND have color mapping specified by the user.
 *
 * @public
 */
export interface IColorMappingItem {
    id: string;
    color: IColor;
}

//
// Type guards
//

/**
 * Type guard checking whether the provided object is an Insight.
 *
 * @public
 */
export function isInsight(obj: any): obj is IInsight {
    return !isEmpty(obj) && (obj as IInsight).insight !== undefined;
}

//
// Functions
//

/**
 * Finds bucket matching the provided predicate in an insight.
 *
 * This function also provides convenience to find bucket by its local identifier - if you pass predicate as
 * string the function will automatically create idMatchBucket predicate.
 *
 * @param insight - insight to work with
 * @param idOrFun - local identifier or bucket predicate
 * @returns undefined if none match
 * @public
 */
export function insightBucket(
    insight: IInsightWithoutIdentifier,
    idOrFun: string | BucketPredicate = anyBucket,
): IBucket | undefined {
    if (!insight) {
        return;
    }

    return bucketsFind(insight.insight.buckets, idOrFun);
}

/**
 * Gets buckets for the insight. If ids are provided, then only returns buckets matching the ids.
 *
 * @param insight - insight to work with
 * @param ids - local identifiers of buckets
 * @returns empty list if none match
 * @public
 */
export function insightBuckets(insight: IInsightWithoutIdentifier, ...ids: string[]): IBucket[] {
    if (!insight) {
        return [];
    }

    if (isEmpty(ids)) {
        return insight.insight.buckets;
    }

    return bucketsById(insight.insight.buckets, ...ids);
}

/**
 * Gets all measures used in the provided insight.
 *
 * @param insight - insight to work with
 * @returns empty if one
 * @public
 */
export function insightMeasures(insight: IInsightWithoutIdentifier): IMeasure[] {
    if (!insight) {
        return [];
    }

    return bucketsMeasures(insight.insight.buckets);
}

/**
 * Tests whether insight uses any measures.
 *
 * @param insight - insight to test
 * @returns true if any measures, false if not
 * @public
 */
export function insightHasMeasures(insight: IInsightWithoutIdentifier): boolean {
    if (!insight) {
        return false;
    }

    return insightMeasures(insight).length > 0;
}

/**
 * Gets all attributes used in the provided insight
 *
 * @param insight - insight to work with
 * @returns empty if none
 * @public
 */
export function insightAttributes(insight: IInsightWithoutIdentifier): IAttribute[] {
    if (!insight) {
        return [];
    }

    return bucketsAttributes(insight.insight.buckets);
}

/**
 * Tests whether insight uses any attributes
 *
 * @param insight - insight to test
 * @returns true if any measures, false if not
 * @public
 */
export function insightHasAttributes(insight: IInsightWithoutIdentifier): boolean {
    if (!insight) {
        return false;
    }

    return insightAttributes(insight).length > 0;
}

/**
 * Tests whether insight contains valid definition of data to visualise - meaning at least one attribute or
 * one measure is defined in the insight.
 *
 * @param insight - insight to test
 * @returns true if at least one measure or attribute, false if none
 * @public
 */
export function insightHasDataDefined(insight: IInsightWithoutIdentifier): boolean {
    if (!insight) {
        return false;
    }

    return (
        insight.insight.buckets.length > 0 && (insightHasMeasures(insight) || insightHasAttributes(insight))
    );
}

/**
 * Gets filters used in an insight.
 *
 * @param insight - insight to work with
 * @public
 */
export function insightFilters(insight: IInsightWithoutIdentifier): IFilter[] {
    if (!insight) {
        return [];
    }

    return insight.insight.filters;
}

/**
 * Gets sorting defined in the insight.
 *
 * Note: this function ensures that only sorts working on top of attributes and measures defined in the
 * insight will be returned. Any invalid entries will be stripped.
 *
 * @param insight - insight to get sorts from
 * @returns array of valid sorts
 * @public
 */
export function insightSorts(insight: IInsightWithoutIdentifier): SortItem[] {
    if (!insight) {
        return [];
    }

    const attributeIds = insightAttributes(insight).map(attributeLocalId);
    const measureIds = insightMeasures(insight).map(measureLocalId);

    function contains(arr1: string[], arr2: string[]): boolean {
        return intersection(arr1, arr2).length === arr2.length;
    }

    return insight.insight.sorts.filter(s => {
        const entities: SortEntityIds = sortEntityIds(s);

        return (
            contains(attributeIds, entities.attributeIdentifiers) &&
            contains(measureIds, entities.measureIdentifiers)
        );
    });
}

/**
 * Gets all totals defined in the insight
 *
 * @param insight - insight to get totals from
 * @returns empty if none
 * @public
 */
export function insightTotals(insight: IInsightWithoutIdentifier): ITotal[] {
    if (!insight) {
        return [];
    }

    return bucketsTotals(insight.insight.buckets);
}

/**
 * Gets visualization properties of an insight.
 *
 * @param insight - insight to get vis properties for
 * @returns empty object is no properties
 * @public
 */
export function insightProperties(insight: IInsightWithoutIdentifier): VisualizationProperties {
    if (!insight) {
        return {};
    }

    return insight.insight.properties;
}

/**
 * Gets visualization class identifier of an insight.
 *
 * @param insight - insight to get vis class identifier for
 * @public
 */
export function insightVisualizationClassIdentifier(insight: IInsightWithoutIdentifier): string {
    invariant(insight, "insight to get vis class identifier from must be defined");

    return insight.insight.visualizationClassIdentifier;
}

/**
 * Gets the insight title
 *
 * @param insight - insight to title of
 * @returns the insight title
 * @public
 */
export function insightTitle(insight: IInsightWithoutIdentifier): string {
    invariant(insight, "insight to get title from must be defined");

    return insight.insight.title;
}

/**
 * Gets the insight id
 *
 * @param insight - insight to get id of
 * @returns the insight id
 * @public
 */
export function insightId(insight: IInsight): string {
    invariant(insight, "insight to get id of must be defined");

    return insight.insight.identifier;
}

/**
 * Gets a new insight that 'inherits' all data from the provided insight but has different properties. New
 * properties will be used in the new insight as-is, no merging with existing properties.
 *
 * @param insight - insight to work with
 * @param properties - new properties to have on the new insight
 * @returns always new instance
 * @public
 */
export function insightSetProperties(insight: IInsight, properties?: VisualizationProperties): IInsight;
export function insightSetProperties(
    insight: IInsightWithoutIdentifier,
    properties: VisualizationProperties = {},
): IInsightWithoutIdentifier {
    return {
        insight: {
            ...insight.insight,
            properties,
        },
    };
}

/**
 * Gets a new insight that 'inherits' all data from the provided insight but has different sorts. New
 * sorts will be used in the new insight as-is, no merging with existing sorts.
 *
 * @param insight - insight to work with
 * @param sorts - new sorts to apply
 * @returns always new instance
 * @public
 */
export function insightSetSorts(insight: IInsight, sorts?: SortItem[]): IInsight;
export function insightSetSorts(
    insight: IInsightWithoutIdentifier,
    sorts: SortItem[] = [],
): IInsightWithoutIdentifier {
    return {
        insight: {
            ...insight.insight,
            sorts,
        },
    };
}

//
// Visualization class functions
//

/**
 * For given visualization class, return URL where the vis assets are stored.
 *
 * @param vc - visualization class
 * @returns never null, never empty
 * @public
 */
export function visClassUrl(vc: IVisualizationClass): string {
    invariant(vc, "vis class to get URL from must be defined");

    return vc.visualizationClass.url;
}
