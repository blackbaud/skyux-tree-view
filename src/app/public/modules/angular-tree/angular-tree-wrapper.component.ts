import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input
} from '@angular/core';

import {
  KEYS,
  TREE_ACTIONS,
  TreeComponent,
  TreeModel,
  TreeNode
} from 'angular-tree-component';

@Component({
  selector: 'sky-angular-tree-wrapper',
  templateUrl: './angular-tree-wrapper.component.html',
  styleUrls: ['./angular-tree-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkyAngularTreeWrapperComponent implements AfterViewInit {

  @Input()
  public selectLeafNodesOnly: boolean = false;

  @Input()
  public selectSingle: boolean = false;

  @Input()
  public set showToolbar(value: boolean) {
    this._showToolbar = value;
  }

  public get showToolbar(): boolean {
    return this._showToolbar || false;
  }

  @ContentChild(TreeComponent)
  public treeComponent: TreeComponent;

  private _showToolbar: boolean;

  public ngAfterViewInit(): void {
    if (this.selectSingle && this.treeComponent.treeModel.options.useTriState) {
      console.warn(
        'Single select mode should not be enabled while the tree is in triState mode (cascading selection). '
        + 'Please set "useTriState" to "false" if you want to remain in single select mode.'
      );
    }
    this.overrideActionMapping();
  }

  public multiselectable(): boolean {
    return this.treeComponent.treeModel.options.useCheckbox && !this.selectSingle;
  }

  public onClearAllClick(): void {
    const focusedNode = this.treeComponent.treeModel.getFocusedNode();
    /* istanbul ignore else */
    if (!this.selectSingle) {
      this.treeComponent.treeModel.doForAll((node: TreeNode) => {
        const selectable = node.isSelectable && !(node.hasChildren && this.selectLeafNodesOnly);
        /* istanbul ignore else */
        if (selectable) {
          node.setIsSelected(false);
          this.treeComponent.treeModel.setFocusedNode(focusedNode);
        }
      });
    }
  }

  public onCollapseAllClick(): void {
    this.treeComponent.treeModel.collapseAll();
  }

  public onExpandAllClick(): void {
    this.treeComponent.treeModel.expandAll();
  }

  public onSelectAllClick(): void {
    const focusedNode = this.treeComponent.treeModel.getFocusedNode();
    /* istanbul ignore else */
    if (!this.selectSingle) {
      this.treeComponent.treeModel.doForAll((node: TreeNode) => {
        const selectable = node.isSelectable && !(node.hasChildren && this.selectLeafNodesOnly);
        /* istanbul ignore else */
        if (selectable) {
          node.setIsSelected(true);
          this.treeComponent.treeModel.setFocusedNode(focusedNode);
        }
      });
    }
  }

  public showSelectButtons(): boolean {
    return this.treeComponent.treeModel.options.useCheckbox && !this.selectSingle;
  }

  private isSelectable(node: TreeNode): boolean {
    return node.isLeaf || !node.hasChildren || !this.selectLeafNodesOnly;
  }

  private nodeDefaultAction(tree: TreeModel, node: TreeNode, event: any): void {
    if (node.options.useCheckbox && this.isSelectable(node)) {
      this.toggleSelected(node, event);
    } else {
      TREE_ACTIONS.TOGGLE_ACTIVE(tree, node, event);
    }
  }

  private overrideActionMapping(): void {
    const defaultActionMapping = this.treeComponent.treeModel.options.actionMapping;

    // Override default click/enter/space action to check for unsupported options (leaf node, single-select).
    defaultActionMapping.mouse.click = (tree, node, $event) => this.nodeDefaultAction(tree, node, event);
    defaultActionMapping.keys[KEYS.SPACE] = (tree, node, $event) => this.nodeDefaultAction(tree, node, event);
    defaultActionMapping.keys[KEYS.ENTER] = (tree, node, $event) => this.nodeDefaultAction(tree, node, event);

    // Disable left/right arrow keys to support navigating through interactive elements with keyboard.
    // See onArrowLeft() / onArrowRight() methods inside the angular-tree-node.component.ts.
    defaultActionMapping.keys[KEYS.RIGHT] = (tree, node, $event) => undefined;
    defaultActionMapping.keys[KEYS.LEFT] = (tree, node, $event) => undefined;
  }

  private toggleSelected(node: TreeNode, event: any): void {
    // If single-selection is enabled, first de-select all other nodes.
    if (this.selectSingle && !node.isSelected) {
      const selectedNodes = node.treeModel.selectedLeafNodes;
      selectedNodes
        .forEach((n: TreeNode) => {
          n.setIsSelected(false);
        });
    }

    TREE_ACTIONS.TOGGLE_SELECTED(node.treeModel, node, event);
  }
}
