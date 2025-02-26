# **Mod Allowance**

## **Overview**

`ModAllowance` is a comprehensive validation module within the Veive protocol, designed specifically for the Koinos blockchain. This module employs an allowance mechanism to pre-authorize operations, ensuring that only actions explicitly approved by the user are executed. By leveraging this mechanism, `ModAllowance` provides robust control over transaction execution, preventing unauthorized actions and potential replay attacks. Notably, this module is also applicable for validating internal operations, ensuring that even operations triggered within a contract are authorized.

## **Purpose**

The `ModAllowance` module serves as a pivotal component in the Veive ecosystem by validating operations against a set of pre-authorized allowances. This functionality is crucial for both external and internal operations, ensuring comprehensive security and control. Key features include:

- **Allowance Mechanism**: Users can pre-authorize specific operations using the `allow` method, which stores details such as the operation's contract ID, entry point, arguments, and transaction ID. This mechanism prevents unauthorized transactions and ensures that each allowance is tied to a specific transaction, preventing reuse. This feature is particularly important for managing internal operations, where contracts may invoke additional operations.

- **Validation Process**: During execution, `ModAllowance` checks if the incoming operation matches any stored allowances. It verifies transaction ID, contract ID, entry point, and arguments. If a match is found, the corresponding allowance is removed, ensuring that it cannot be reused, thus preventing replay attacks. This process includes verifying allowances for operations that may be internally triggered by other contracts, ensuring a comprehensive validation scope.

- **Scope Management**: The default scope for `ModAllowance` is set to "call_contract," meaning it can validate any call contract operation unless a more specific scope is defined. This flexibility allows for the module's application across a broad range of scenarios, from general validation to specific contract operations.

## **Usage**

### **Installation**

To install the `ModAllowance` module, ensure you have the Veive protocol set up on your Koinos blockchain environment. Install the module using yarn:

```bash
yarn add @veive-io/mod-allowance-as
```

Deploy the module contract on the Koinos blockchain and install it on the desired account using the `install_module` method provided by the Veive account interface. During installation, the `on_install` method is called to set the necessary configurations and link the module to the account.

### **Example**

Here is an example of how to use `ModAllowance`:

```javascript
// prepare operation
const { operation: transfer } = await tokenContract['transfer']({
  from: account1Sign.address,
  to: account2Sign.address,
  value: "1",
}, { onlyOperation: true });

// allow operation
const { operation: allow } = await modContract['allow']({
  user: account1Sign.address,
  operation: {
    contract_id: transfer.call_contract.contract_id,
    entry_point: transfer.call_contract.entry_point,
    args: transfer.call_contract.args
  }
}, { onlyOperation: true });

const tx = new Transaction({
  signer: account1Sign,
  provider,
});

await tx.pushOperation(allow);
await tx.pushOperation(transfer);
const receipt = await tx.send();
await tx.wait();
```

### **Scripts**

#### Build

To compile the package, run:

```bash
yarn build
```

#### Dist

To create a distribution, run:

```bash
yarn dist
```

#### Test

To test the package, use:

```bash
yarn jest
```

## **Contributing**

Contributions are welcome! Please open an issue or submit a pull request on the [GitHub repository](https://github.com/veiveprotocol/mod-allowance-as).

## **License**

This project is licensed under the MIT License. See the LICENSE file for details.

