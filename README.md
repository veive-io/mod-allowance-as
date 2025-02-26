# **Mod Allowance**

## **Overview**

`ModAllowance` is a comprehensive validation module within the Veive protocol, designed specifically for the Koinos blockchain. This module employs an allowance mechanism to pre-authorize operations, ensuring that only actions explicitly approved by the user are executed. By leveraging this mechanism, `ModAllowance` provides robust control over transaction execution, preventing unauthorized actions and potential replay attacks. Notably, this module is also applicable for validating internal operations, ensuring that even operations triggered within a contract are authorized.

Full documentation: https://docs.veive.io/veive-docs/framework/core-modules/mod-allowance

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

