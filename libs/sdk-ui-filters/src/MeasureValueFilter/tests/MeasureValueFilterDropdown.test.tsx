// (C) 2019 GoodData Corporation
import * as React from "react";
import { mount } from "enzyme";
import noop = require("lodash/noop");
import { newMeasureValueFilter, IMeasureValueFilter } from "@gooddata/sdk-model";

import MVFDropdownFragment from "./fragments/MeasureValueFilterDropdown";
import { MeasureValueFilterDropdown, IMeasureValueFilterDropdownProps } from "../MeasureValueFilterDropdown";
import { withIntl } from "@gooddata/sdk-ui";

// we cannot use factory here, it does not allow creating empty filters
const emptyFilter: IMeasureValueFilter = {
    measureValueFilter: {
        measure: {
            identifier: "myMeasure",
        },
    },
};

const renderComponent = (props?: Partial<IMeasureValueFilterDropdownProps>) => {
    const defaultProps: IMeasureValueFilterDropdownProps = {
        onApply: noop,
        onCancel: noop,
        measureIdentifier: "myMeasure",
        filter: emptyFilter,
    };
    const Wrapped = withIntl(MeasureValueFilterDropdown);
    return new MVFDropdownFragment(mount(<Wrapped {...defaultProps} {...props} />));
};

describe("Measure value filter dropdown", () => {
    it("should render single value input when comparison type operator is selected", () => {
        const component = renderComponent();

        component.openOperatorDropdown().selectOperator("GREATER_THAN");

        expect(component.getRangeFromInput().length).toEqual(0);
        expect(component.getRangeToInput().length).toEqual(0);
        expect(component.getComparisonValueInput().length).toEqual(1);
    });

    it("should render from and to inputs when range type operator is selected", () => {
        const component = renderComponent();

        component.openOperatorDropdown().selectOperator("BETWEEN");

        expect(component.getRangeFromInput().length).toEqual(1);
        expect(component.getRangeToInput().length).toEqual(1);
        expect(component.getComparisonValueInput().length).toEqual(0);
    });

    it("should have All operator preselected and no inputs rendered if there is no filter provided", () => {
        const component = renderComponent();

        expect(component.getSelectedOperatorTitle()).toEqual("All");
        expect(component.getRangeFromInput().length).toEqual(0);
        expect(component.getRangeToInput().length).toEqual(0);
        expect(component.getComparisonValueInput().length).toEqual(0);
    });

    it("should have given operator preselected and values filled if filter is provided", () => {
        const filter = newMeasureValueFilter({ identifier: "myMeasure" }, "LESS_THAN", 100);
        const component = renderComponent({ filter });

        expect(component.getSelectedOperatorTitle()).toEqual("Less than");
        expect(component.getComparisonValueInput().props().value).toEqual("100");
    });

    it("should have selected operator highlighted in operator dropdown", () => {
        const filter = newMeasureValueFilter({ identifier: "myMeasure" }, "LESS_THAN", 100);
        const component = renderComponent({ filter });

        expect(component.openOperatorDropdown().getOperator("LESS_THAN").hasClass("is-selected")).toEqual(
            true,
        );
    });

    it("should render an input suffix for comparison value input field to display percentage sign if the measure is native percent", () => {
        const component = renderComponent({ usePercentage: true });

        component.openOperatorDropdown().selectOperator("GREATER_THAN");

        expect(component.getInputSuffixes().length).toEqual(1);
    });

    it("should render an input suffix for each range value input field to display percentage sign if the measure is native percent", () => {
        const component = renderComponent({ usePercentage: true });

        component.openOperatorDropdown().selectOperator("BETWEEN");

        expect(component.getInputSuffixes().length).toEqual(2);
    });

    it("should not render warning message if not provided", () => {
        const component = renderComponent();

        expect(component.getWarningMessage().length).toEqual(0);
    });

    it("should render warning message if provided", () => {
        const warningMessage = "The filter uses actual measure values, not percentage.";
        const component = renderComponent({ warningMessage });

        expect(component.getWarningMessage().length).toEqual(1);
        expect(component.getWarningMessageText()).toEqual(warningMessage);
    });

    describe("tooltip", () => {
        const component = renderComponent();

        const hasTooltipClass = (operator: string) =>
            component.openOperatorDropdown().getOperator(operator).find(".tooltip-bubble").exists();

        it.each`
            operator                      | showTooltip
            ${"BETWEEN"}                  | ${true}
            ${"NOT_BETWEEN"}              | ${true}
            ${"GREATER_THAN_OR_EQUAL_TO"} | ${false}
            ${"LESS_THAN"}                | ${false}
            ${"LESS_THAN_OR_EQUAL_TO"}    | ${false}
            ${"EQUAL_TO"}                 | ${false}
            ${"NOT_EQUAL_TO"}             | ${false}
            ${"GREATER_THAN"}             | ${false}
            ${"ALL"}                      | ${false}
        `("should return $showTooltip when operator is $operator", ({ operator, showTooltip }) => {
            expect(hasTooltipClass(operator)).toEqual(showTooltip);
        });
    });

    describe("onApply callback", () => {
        it("should be called with comparison type measure value filter when comparison operator is selected and value is filled", () => {
            const onApply = jest.fn();
            const component = renderComponent({ onApply });

            const expectedFilter = newMeasureValueFilter(
                { localIdentifier: "myMeasure" },
                "GREATER_THAN",
                100,
            );

            component
                .openOperatorDropdown()
                .selectOperator("GREATER_THAN")
                .setComparisonValue("100")
                .clickApply();

            expect(onApply).toBeCalledWith(expectedFilter);
        });

        it("should be called with range type measure value filter when range operator is selected and both values are filled", () => {
            const onApply = jest.fn();
            const component = renderComponent({ onApply });

            const expectedFilter = newMeasureValueFilter(
                { localIdentifier: "myMeasure" },
                "BETWEEN",
                100,
                200,
            );

            component
                .openOperatorDropdown()
                .selectOperator("BETWEEN")
                .setRangeFrom("100")
                .setRangeTo("200")
                .clickApply();

            expect(onApply).toBeCalledWith(expectedFilter);
        });

        it("should be called with null value when All operator is applied", () => {
            const onApply = jest.fn();
            const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "LESS_THAN", 100);
            const component = renderComponent({ filter, onApply });

            component.openOperatorDropdown().selectOperator("ALL").clickApply();

            expect(onApply).toBeCalledWith(null);
        });

        it("should be called with raw value when the measure is displayed as percentage with a comparison type measure value filter", () => {
            const onApply = jest.fn();
            const component = renderComponent({ onApply, usePercentage: true });

            const expectedFilter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "GREATER_THAN", 1);

            component
                .openOperatorDropdown()
                .selectOperator("GREATER_THAN")
                .setComparisonValue("100")
                .clickApply();

            expect(onApply).toBeCalledWith(expectedFilter);
        });

        it("should be called with raw value when the measure is displayed as percentage with a range type measure value filter", () => {
            const onApply = jest.fn();
            const component = renderComponent({ onApply, usePercentage: true });

            const expectedFilter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "BETWEEN", 1, 2);

            component
                .openOperatorDropdown()
                .selectOperator("BETWEEN")
                .setRangeFrom("100")
                .setRangeTo("200")
                .clickApply();

            expect(onApply).toBeCalledWith(expectedFilter);
        });

        it("should be called with null value when All operator is applied when the measure is displayed as percentage", () => {
            const onApply = jest.fn();
            const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "LESS_THAN", 100);
            const component = renderComponent({ filter, onApply, usePercentage: true });

            component.openOperatorDropdown().selectOperator("ALL").clickApply();

            expect(onApply).toBeCalledWith(null);
        });

        it("should compensate for JavaScript division result precision problem for comparison filter", () => {
            const onApply = jest.fn();
            const component = renderComponent({ onApply, usePercentage: true });

            component
                .openOperatorDropdown()
                .selectOperator("GREATER_THAN")
                .setComparisonValue("42.1")
                .clickApply();

            const expectedFilter = newMeasureValueFilter(
                { localIdentifier: "myMeasure" },
                "GREATER_THAN",
                0.421,
            );
            expect(onApply).toBeCalledWith(expectedFilter);
        });

        it("should compensate for JavaScript division result precision problem for range filter", () => {
            const onApply = jest.fn();
            const component = renderComponent({ onApply, usePercentage: true });

            component
                .openOperatorDropdown()
                .selectOperator("BETWEEN")
                .setRangeFrom("42.1")
                .setRangeTo("1151.545")
                .clickApply();

            const expectedFilter = newMeasureValueFilter(
                { localIdentifier: "myMeasure" },
                "BETWEEN",
                0.421,
                11.51545,
            );
            expect(onApply).toBeCalledWith(expectedFilter);
        });

        it("should compensate for JavaScript multiplication result precision problem for comparison filter", () => {
            const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "LESS_THAN", 46.001);

            const component = renderComponent({ filter, usePercentage: true });

            expect(component.getComparisonValueInput().props().value).toEqual("4,600.1");
        });

        it("should compensate for JavaScript multiplication result precision problem for range filter", () => {
            const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "NOT_BETWEEN", 1.11, 4.44);
            const component = renderComponent({ filter, usePercentage: true });

            expect(component.getRangeFromInput().props().value).toEqual("111");
            expect(component.getRangeToInput().props().value).toEqual("444");
        });

        describe("apply button", () => {
            it("should enable apply button when operator is changed to all from comparison operator", () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "EQUAL_TO", 10);
                const component = renderComponent({ filter });

                component.openOperatorDropdown().selectOperator("ALL");

                expect(component.isApplyButtonDisabled()).toEqual(false);
            });

            it("should enable apply button when value changes with comparison operator", () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "EQUAL_TO", 10);
                const component = renderComponent({ filter });

                component.setComparisonValue("1000");

                expect(component.isApplyButtonDisabled()).toEqual(false);
            });

            it("should disable apply button when value is empty with comparison operator", () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "EQUAL_TO", 10);
                const component = renderComponent({ filter });

                component.setComparisonValue("");

                expect(component.isApplyButtonDisabled()).toEqual(true);
            });

            it("should disable apply button when value is equal to prop value with comparison operator", () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "EQUAL_TO", 10);
                const component = renderComponent({ filter });

                component.setComparisonValue("100").setComparisonValue("10");

                expect(component.isApplyButtonDisabled()).toEqual(true);
            });

            it('should enable apply button when "from" value changes', () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "BETWEEN", 10, 10);
                const component = renderComponent({ filter });

                component.setRangeFrom("100");

                expect(component.isApplyButtonDisabled()).toEqual(false);
            });

            it('should enable apply button when "to" value changes', () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "BETWEEN", 10, 10);
                const component = renderComponent({ filter });

                component.setRangeTo("100");

                expect(component.isApplyButtonDisabled()).toEqual(false);
            });

            it('should disable apply button when "to" value is empty', () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "BETWEEN", 10, 10);
                const component = renderComponent({ filter });

                component.setRangeTo("");

                expect(component.isApplyButtonDisabled()).toEqual(true);
            });

            it('should disable apply button when "from" value is empty', () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "BETWEEN", 10, 10);
                const component = renderComponent({ filter });

                component.setRangeFrom("");

                expect(component.isApplyButtonDisabled()).toEqual(true);
            });

            it("should disable apply button when value is equal to prop value with range operator", () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "BETWEEN", 10, 10);
                const component = renderComponent({ filter });

                component.setRangeTo("100").setRangeTo("10");

                expect(component.isApplyButtonDisabled()).toEqual(true);
            });

            it("should enable apply button when operator is changed but value is same with comparison operator", () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "LESS_THAN", 10);
                const component = renderComponent({ filter });

                component.openOperatorDropdown().selectOperator("GREATER_THAN");

                expect(component.isApplyButtonDisabled()).toEqual(false);
            });

            it("should enable apply button when operator is changed but value is same with range operator", () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "BETWEEN", 10, 10);
                const component = renderComponent({ filter });

                component.openOperatorDropdown().selectOperator("NOT_BETWEEN");

                expect(component.isApplyButtonDisabled()).toEqual(false);
            });

            it("should enable apply button when operator and value is unchanged, but treat-null-values-as checkbox has been toggled", () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "GREATER_THAN", 10);

                const component = renderComponent({ filter, displayTreatNullAsZeroOption: true });

                expect(component.isApplyButtonDisabled()).toEqual(true);

                component.toggleTreatNullAsCheckbox();

                expect(component.isApplyButtonDisabled()).toEqual(false);
            });

            it("should handle the change from comparison to range filter", () => {
                const onApply = jest.fn();
                const component = renderComponent({ usePercentage: true, onApply });

                const expectedComparisonFilter = newMeasureValueFilter(
                    { localIdentifier: "myMeasure" },
                    "GREATER_THAN",
                    1,
                );

                component
                    .openOperatorDropdown()
                    .selectOperator("GREATER_THAN")
                    .setComparisonValue("100")
                    .clickApply();

                expect(onApply).toBeCalledWith(expectedComparisonFilter);

                const expectedRangeFilter = newMeasureValueFilter(
                    { localIdentifier: "myMeasure" },
                    "BETWEEN",
                    2,
                    5,
                );

                component
                    .openOperatorDropdown()
                    .selectOperator("BETWEEN")
                    .setRangeFrom("200")
                    .setRangeTo("500")
                    .clickApply();

                expect(onApply).nthCalledWith(2, expectedRangeFilter);
            });
        });
    });

    describe("press enter", () => {
        it("should be able to press enter to apply when apply button is enabled", () => {
            const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "LESS_THAN", 10);
            const onApply = jest.fn();
            const component = renderComponent({ filter, onApply });

            component.setComparisonValue("20").pressEnterInComparisonInput();

            expect(onApply).toHaveBeenCalledTimes(1);
        });

        it("should not be able to press enter to apply when apply button is disabled", () => {
            const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "LESS_THAN", 10);
            const onApply = jest.fn();
            const component = renderComponent({ filter, onApply });

            component.pressEnterInComparisonInput();

            expect(onApply).toHaveBeenCalledTimes(0);
        });
    });

    describe("onCancel feedback", () => {
        it("should be called when cancelled", () => {
            const onCancel = jest.fn();
            const component = renderComponent({ onCancel });

            component.openOperatorDropdown().selectOperator("BETWEEN").setRangeFrom("100").clickCancel();

            expect(onCancel).toBeCalled();
        });
    });

    describe("filter with treat-null-values-as", () => {
        it("should contain 'treatNullValuesAs' property if checked", () => {
            const onApply = jest.fn();
            const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "GREATER_THAN", 100);
            const expectedFilter = newMeasureValueFilter(
                { localIdentifier: "myMeasure" },
                "GREATER_THAN",
                100,
                0,
            );

            const component = renderComponent({
                filter,
                onApply,
                displayTreatNullAsZeroOption: true,
            });

            component.toggleTreatNullAsCheckbox().clickApply();

            expect(onApply).toBeCalledWith(expectedFilter);
        });

        it("should contain 'treatNullValuesAs' equal to 0 if checked, but no 'treatNullAsZeroDefaultValue' was provided", () => {
            const onApply = jest.fn();
            const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "GREATER_THAN", 100);
            const expectedFilter = newMeasureValueFilter(
                { localIdentifier: "myMeasure" },
                "GREATER_THAN",
                100,
                0,
            );

            const component = renderComponent({
                filter,
                onApply,
                displayTreatNullAsZeroOption: true,
            });

            component.toggleTreatNullAsCheckbox().clickApply();

            expect(onApply).toBeCalledWith(expectedFilter);
        });

        it("should be called with filter not containing 'treatNullValuesAs' property if treat-null-values-as checkbox was unchecked", () => {
            const onApply = jest.fn();

            const filterWithTreatNullValuesAsZero = newMeasureValueFilter(
                { localIdentifier: "myMeasure" },
                "GREATER_THAN",
                100,
                0,
            );
            const expectedFilter = newMeasureValueFilter(
                { localIdentifier: "myMeasure" },
                "GREATER_THAN",
                100,
            );

            const component = renderComponent({
                filter: filterWithTreatNullValuesAsZero,
                onApply,
                displayTreatNullAsZeroOption: true,
            });

            component.toggleTreatNullAsCheckbox().clickApply();

            expect(onApply).toBeCalledWith(expectedFilter);
        });
    });

    describe("treat-null-values-as checkbox", () => {
        it("should not be displayed by default", () => {
            const component = renderComponent();

            expect(component.getTreatNullAsCheckbox().exists()).toEqual(false);
        });

        it("should not be displayed when all operator is selected", () => {
            const component = renderComponent({ displayTreatNullAsZeroOption: true });

            expect(component.getTreatNullAsCheckbox().exists()).toEqual(false);
        });

        it("should be displayed when enabled by 'displayOptionTreatNullValuesAs' prop and all operator is not selected", () => {
            const component = renderComponent({ displayTreatNullAsZeroOption: true });

            component.openOperatorDropdown().selectOperator("GREATER_THAN");

            expect(component.getTreatNullAsCheckbox().exists()).toEqual(true);
        });

        describe("checked state", () => {
            const renderComponentWithTreatNullAsZeroOption = (
                props?: Partial<IMeasureValueFilterDropdownProps>,
            ) => renderComponent({ displayTreatNullAsZeroOption: true, ...props });

            it("should be checked when passed filter is empty and 'treatNullAsZeroDefaultValue' property is truthy", () => {
                const component = renderComponentWithTreatNullAsZeroOption({
                    treatNullAsZeroDefaultValue: true,
                    filter: emptyFilter,
                });

                component.openOperatorDropdown().selectOperator("GREATER_THAN");

                expect(component.getTreatNullAsCheckbox().props().checked).toEqual(true);
            });

            it("should not be checked when passed filter is empty and 'treatNullAsZeroDefaultValue' property is set to false", () => {
                const component = renderComponentWithTreatNullAsZeroOption({
                    treatNullAsZeroDefaultValue: false,
                    filter: emptyFilter,
                });

                component.openOperatorDropdown().selectOperator("GREATER_THAN");

                expect(component.getTreatNullAsCheckbox().props().checked).toEqual(false);
            });

            it("should be checked when passed filter has a condition with 'treatNullValuesAsZero' property set to true", () => {
                const filter = newMeasureValueFilter(
                    { localIdentifier: "myMeasure" },
                    "GREATER_THAN",
                    100,
                    0,
                );
                const component = renderComponentWithTreatNullAsZeroOption({ filter });

                expect(component.getTreatNullAsCheckbox().props().checked).toEqual(true);
            });

            it("should not be checked when passed filter has a condition without 'treatNullValuesAsZero' property even if 'treatNullAsZeroDefaultValue' property is truthy", () => {
                const filter = newMeasureValueFilter({ localIdentifier: "myMeasure" }, "GREATER_THAN", 100);
                const component = renderComponentWithTreatNullAsZeroOption({ filter });

                expect(component.getTreatNullAsCheckbox().props().checked).toEqual(false);
            });
        });
    });
});
