// (C) 2020 GoodData Corporation
import React, { useMemo } from "react";
import {
    isWidget,
    widgetId,
    widgetUri,
    isInsightWidget,
    isDashboardLayoutEmpty,
} from "@gooddata/sdk-backend-spi";
import {
    ObjRef,
    IInsight,
    insightId,
    insightUri,
    areObjRefsEqual,
    objRefToString,
} from "@gooddata/sdk-model";

import { selectInsights, selectSettings, selectBasicLayout, useDashboardSelector } from "../../model";
import { useDashboardComponentsContext } from "../dashboardContexts";

import { DashboardLayoutWidget } from "./DashboardLayoutWidget";
import { EmptyDashboardError } from "./EmptyDashboardError";
import { DashboardLayoutProps } from "./types";
import {
    DashboardLayout,
    DashboardLayoutBuilder,
    DashboardLayoutItemModifications,
    DashboardLayoutItemsSelector,
    validateDashboardLayoutWidgetSize,
} from "./DefaultDashboardLayoutRenderer";
import { DashboardLayoutPropsProvider, useDashboardLayoutProps } from "./DashboardLayoutPropsContext";

const selectAllItemsWithInsights: DashboardLayoutItemsSelector = (items) =>
    items.filter((item) => item.isInsightWidgetItem());

/**
 * @internal
 */
export const DefaultDashboardLayoutInner = (): JSX.Element => {
    const {
        onFiltersChange,
        drillableItems,
        onDrill,
        onError,
        ErrorComponent: CustomError,
    } = useDashboardLayoutProps();

    const layout = useDashboardSelector(selectBasicLayout);
    const settings = useDashboardSelector(selectSettings);
    const insights = useDashboardSelector(selectInsights);
    const { ErrorComponent } = useDashboardComponentsContext({ ErrorComponent: CustomError });

    const getInsightByRef = (insightRef: ObjRef): IInsight | undefined => {
        return insights.find((i) => areObjRefsEqual(i.insight.ref, insightRef));
    };

    const transformedLayout = useMemo(() => {
        const commonLayoutBuilder = DashboardLayoutBuilder.for(layout).modifySections((section) =>
            section
                .modifyItems(polluteWidgetRefsWithBothIdAndUri(getInsightByRef))
                .modifyItems(
                    validateItemsSize(getInsightByRef, settings.enableKDWidgetCustomHeight!),
                    selectAllItemsWithInsights,
                ),
        );
        return commonLayoutBuilder.build();
    }, [layout]);

    return isDashboardLayoutEmpty(layout) ? (
        <EmptyDashboardError ErrorComponent={ErrorComponent} />
    ) : (
        <DashboardLayout
            layout={transformedLayout}
            itemKeyGetter={(keyGetterProps) => {
                const widget = keyGetterProps.item.widget();
                if (isWidget(widget)) {
                    return objRefToString(widget.ref);
                }
                return keyGetterProps.item.index().toString();
            }}
            widgetRenderer={(renderProps) => {
                return (
                    <DashboardLayoutWidget
                        drillableItems={drillableItems}
                        onError={onError}
                        onDrill={onDrill}
                        onFiltersChange={onFiltersChange}
                        {...renderProps}
                    />
                );
            }}
            // When section headers are enabled, use default DashboardLayout sectionHeaderRenderer.
            // When turned off, render nothing.
            sectionHeaderRenderer={settings.enableSectionHeaders ? undefined : () => <React.Fragment />}
            enableCustomHeight={settings.enableKDWidgetCustomHeight}
        />
    );
};

/**
 * @alpha
 */
export const DefaultDashboardLayout = (props: DashboardLayoutProps): JSX.Element => {
    return (
        <DashboardLayoutPropsProvider {...props}>
            <DefaultDashboardLayoutInner />
        </DashboardLayoutPropsProvider>
    );
};

/**
 * Ensure that areObjRefsEqual() and other predicates will be working with uncontrolled user ref inputs in custom layout transformation and/or custom widget/item renderers
 */
const polluteWidgetRefsWithBothIdAndUri =
    (getInsightByRef: (insightRef: ObjRef) => IInsight | undefined): DashboardLayoutItemModifications =>
    (item) =>
        item.widget((c) => {
            let updatedContent = c;
            if (isWidget(updatedContent)) {
                updatedContent = {
                    ...updatedContent,
                    ref: {
                        ...updatedContent.ref,
                        uri: widgetUri(updatedContent),
                        identifier: widgetId(updatedContent),
                    },
                };
            }
            if (isInsightWidget(updatedContent)) {
                const insight = getInsightByRef(updatedContent.insight);
                updatedContent = {
                    ...updatedContent,
                    insight: {
                        ...updatedContent.insight,
                        uri: insightUri(insight!),
                        identifier: insightId(insight!),
                    },
                };
            }

            return updatedContent;
        });

const validateItemsSize =
    (
        getInsightByRef: (insightRef: ObjRef) => IInsight | undefined,
        enableKDWidgetCustomHeight: boolean,
    ): DashboardLayoutItemModifications =>
    (item) => {
        const widget = item.facade().widget();
        if (isInsightWidget(widget)) {
            const insight = getInsightByRef(widget.insight);
            const currentWidth = item.facade().size().xl.gridWidth;
            const currentHeight = item.facade().size().xl.gridHeight;
            const { validWidth, validHeight } = validateDashboardLayoutWidgetSize(
                currentWidth,
                currentHeight,
                "insight",
                insight!,
                { enableKDWidgetCustomHeight },
            );
            let validatedItem = item;
            if (currentWidth !== validWidth) {
                validatedItem = validatedItem.size({
                    xl: {
                        ...validatedItem.facade().size().xl,
                        gridWidth: validWidth,
                    },
                });
            }
            if (currentHeight !== validHeight) {
                validatedItem = validatedItem.size({
                    xl: {
                        ...validatedItem.facade().size().xl,
                        gridHeight: validHeight,
                    },
                });
            }

            return validatedItem;
        }
        return item;
    };