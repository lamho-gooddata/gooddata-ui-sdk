// (C) 2019-2021 GoodData Corporation
import React, { useCallback } from "react";
import { insightVisualizationUrl, objRefToString } from "@gooddata/sdk-model";
import { stringUtils } from "@gooddata/util";
import cx from "classnames";
import { injectIntl, WrappedComponentProps } from "react-intl";
import { Bubble, BubbleHoverTrigger } from "@gooddata/sdk-ui-kit";
import { widgetRef } from "@gooddata/sdk-backend-spi";
import { VisType } from "@gooddata/sdk-ui";

import { selectPermissions, selectSettings, useDashboardSelector } from "../../../../../model";
import { IDashboardInsightMenuButtonProps } from "../../types";

const nonExportableVisTypes: VisType[] = ["headline", "xirr"];
function isExportableVisualization(visType: VisType): boolean {
    return !nonExportableVisTypes.includes(visType);
}

const LegacyInsightMenuButtonCore: React.FC<IDashboardInsightMenuButtonProps & WrappedComponentProps> = ({
    onClick,
    widget,
    insight,
    intl,
    isOpen,
}) => {
    const onOptionsMenuClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            e.stopPropagation();
            onClick();
        },
        [onClick],
    );

    const settings = useDashboardSelector(selectSettings);
    const permissions = useDashboardSelector(selectPermissions);
    const areExportsEnabled = settings.enableKPIDashboardExport;
    const hasExportReportPermissions = permissions.canExportReport;

    const visType = insightVisualizationUrl(insight).split(":")[1] as VisType;
    const isExportableVisType = isExportableVisualization(visType);

    const canExportWidget = areExportsEnabled && hasExportReportPermissions && isExportableVisType;

    if (!canExportWidget) {
        return null;
    }

    const widgetRefValue = widgetRef(widget);
    const objRefAsString = widgetRefValue ? objRefToString(widgetRefValue) : "";

    const optionsIconClasses = cx(
        "dash-item-action-options",
        "s-dash-item-action-options",
        `dash-item-action-options-${stringUtils.simplifyText(objRefAsString)}`,
        `s-dash-item-action-options-${stringUtils.simplifyText(objRefAsString)}`,
        "gd-icon-download",
        {
            "dash-item-action-options-active": isOpen,
        },
    );

    return (
        <div
            className="dash-item-action-placeholder s-dash-item-action-placeholder"
            onClick={onOptionsMenuClick}
        >
            <BubbleHoverTrigger className={optionsIconClasses} showDelay={500} hideDelay={0} tagName="div">
                <Bubble className="bubble-primary" alignPoints={[{ align: "tc bc" }, { align: "tc br" }]}>
                    <span>{intl.formatMessage({ id: "options.button.bubble" })}</span>
                </Bubble>
            </BubbleHoverTrigger>
        </div>
    );
};

export const LegacyInsightMenuButton = injectIntl(LegacyInsightMenuButtonCore);